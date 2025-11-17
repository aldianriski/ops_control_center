import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sopExecutionApi } from '../api/extended';
import {
  PlayCircle,
  CheckCircle,
  Circle,
  Clock,
  Paperclip,
  User,
  Calendar,
  XCircle,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import DetailPanel from './DetailPanel';

interface SOPExecution {
  id: string;
  sop_id: string;
  sop_title: string;
  environment: string;
  triggered_by: string;
  trigger_type: 'manual' | 'incident' | 'scheduled' | 'alert';
  status: 'in_progress' | 'completed' | 'failed';
  started_at: string;
  completed_at?: string;
  steps_completed: {
    step_number: number;
    step_title: string;
    completed: boolean;
    completed_at?: string;
    completed_by?: string;
    notes?: string;
    evidence?: string[];
  }[];
  total_steps: number;
  related_incident_id?: string;
}

interface SOPExecutionModeProps {
  sopId: string;
  sopTitle: string;
  steps: { step_number: number; title: string; description: string }[];
  isOpen: boolean;
  onClose: () => void;
}

const SOPExecutionMode = ({ sopId, sopTitle, steps, isOpen, onClose }: SOPExecutionModeProps) => {
  const queryClient = useQueryClient();
  const [activeExecution, setActiveExecution] = useState<SOPExecution | null>(null);
  const [stepNotes, setStepNotes] = useState<{ [key: number]: string }>({});
  const [evidenceUrls, setEvidenceUrls] = useState<{ [key: number]: string }>({});

  const { data: executions = [] } = useQuery({
    queryKey: ['sop-executions', sopId],
    queryFn: () => sopExecutionApi.getExecutions({ sop_id: sopId }),
    enabled: isOpen && !!sopId,
  });

  const startExecutionMutation = useMutation({
    mutationFn: ({ sopId, environment }: { sopId: string; environment: string }) =>
      sopExecutionApi.start(sopId, environment),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['sop-executions', sopId] });
      setActiveExecution(data);
    },
  });

  const updateExecutionMutation = useMutation({
    mutationFn: ({ executionId, updates }: { executionId: string; updates: any }) =>
      sopExecutionApi.update(executionId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sop-executions', sopId] });
    },
  });

  const handleStartExecution = () => {
    startExecutionMutation.mutate({
      sopId: sopId,
      environment: 'production', // This should come from context
    });
  };

  const handleToggleStep = (stepNumber: number) => {
    if (!activeExecution) return;

    const updatedSteps = activeExecution.steps_completed.map((step) => {
      if (step.step_number === stepNumber) {
        return {
          ...step,
          completed: !step.completed,
          completed_at: !step.completed ? new Date().toISOString() : undefined,
          completed_by: !step.completed ? 'current_user' : undefined,
          notes: stepNotes[stepNumber] || step.notes,
          evidence: evidenceUrls[stepNumber] ? [evidenceUrls[stepNumber]] : step.evidence,
        };
      }
      return step;
    });

    const allCompleted = updatedSteps.every((step) => step.completed);

    updateExecutionMutation.mutate({
      executionId: activeExecution.id,
      updates: {
        steps_completed: updatedSteps,
        status: allCompleted ? 'completed' : 'in_progress',
        completed_at: allCompleted ? new Date().toISOString() : null,
      },
    });

    setActiveExecution({
      ...activeExecution,
      steps_completed: updatedSteps,
      status: allCompleted ? 'completed' : 'in_progress',
    });

    // Clear inputs for this step
    setStepNotes((prev) => ({ ...prev, [stepNumber]: '' }));
    setEvidenceUrls((prev) => ({ ...prev, [stepNumber]: '' }));
  };

  const completedStepsCount = activeExecution?.steps_completed.filter((s) => s.completed).length || 0;
  const totalSteps = activeExecution?.total_steps || steps.length;
  const progressPercentage = totalSteps > 0 ? (completedStepsCount / totalSteps) * 100 : 0;

  if (!isOpen) return null;

  return (
    <DetailPanel isOpen={isOpen} onClose={onClose} title={`Execute SOP: ${sopTitle}`}>
      <div className="space-y-6">
        {/* Execution Controls */}
        {!activeExecution ? (
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
            <div className="text-center">
              <PlayCircle size={48} className="mx-auto text-blue-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Start SOP Execution</h3>
              <p className="text-sm text-gray-600 mb-4">
                This SOP has {steps.length} steps to complete. Click below to start the execution workflow.
              </p>
              <button
                onClick={handleStartExecution}
                disabled={startExecutionMutation.isPending}
                className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed font-medium flex items-center gap-2 mx-auto"
              >
                {startExecutionMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                    Starting...
                  </>
                ) : (
                  <>
                    <PlayCircle size={20} />
                    Start Execution
                  </>
                )}
              </button>
            </div>

            {/* Previous Executions */}
            {executions.length > 0 && (
              <div className="mt-6 pt-6 border-t border-blue-200">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Recent Executions</h4>
                <div className="space-y-2">
                  {executions.slice(0, 3).map((exec: SOPExecution) => (
                    <div
                      key={exec.id}
                      className="bg-white rounded-md p-3 border border-gray-200 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        {exec.status === 'completed' ? (
                          <CheckCircle size={18} className="text-green-500" />
                        ) : exec.status === 'failed' ? (
                          <XCircle size={18} className="text-red-500" />
                        ) : (
                          <Clock size={18} className="text-blue-500" />
                        )}
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {exec.trigger_type.charAt(0).toUpperCase() + exec.trigger_type.slice(1)} execution
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatDistanceToNow(new Date(exec.started_at), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs text-gray-600">
                        {exec.steps_completed.filter((s) => s.completed).length}/{exec.total_steps} steps
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Progress Header */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Execution in Progress</h3>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <User size={14} />
                      <span>{activeExecution.triggered_by}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar size={14} />
                      <span>{format(new Date(activeExecution.started_at), 'MMM dd, yyyy HH:mm')}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-blue-600">
                    {completedStepsCount}/{totalSteps}
                  </div>
                  <div className="text-sm text-gray-600">steps completed</div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
              <div className="text-center text-sm font-medium text-blue-700 mt-2">
                {progressPercentage.toFixed(0)}% Complete
              </div>
            </div>

            {/* Steps Checklist */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 uppercase mb-4">Execution Steps</h4>
              <div className="space-y-4">
                {activeExecution.steps_completed.map((step) => {
                  const stepDetail = steps.find((s) => s.step_number === step.step_number);
                  return (
                    <div
                      key={step.step_number}
                      className={`border-2 rounded-lg p-4 transition-all ${
                        step.completed
                          ? 'border-green-300 bg-green-50'
                          : 'border-gray-200 bg-white hover:border-blue-300'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        {/* Step Checkbox */}
                        <button
                          onClick={() => handleToggleStep(step.step_number)}
                          className="flex-shrink-0 mt-1"
                        >
                          {step.completed ? (
                            <CheckCircle size={24} className="text-green-600" />
                          ) : (
                            <Circle size={24} className="text-gray-400 hover:text-blue-600" />
                          )}
                        </button>

                        {/* Step Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h5
                                className={`font-semibold ${
                                  step.completed ? 'text-green-900 line-through' : 'text-gray-900'
                                }`}
                              >
                                {step.step_number}. {step.step_title}
                              </h5>
                              {stepDetail?.description && (
                                <p className="text-sm text-gray-600 mt-1">{stepDetail.description}</p>
                              )}
                            </div>
                            {step.completed && step.completed_at && (
                              <span className="text-xs text-green-700 bg-green-100 px-2 py-1 rounded-full whitespace-nowrap ml-2">
                                ✓ {format(new Date(step.completed_at), 'HH:mm')}
                              </span>
                            )}
                          </div>

                          {/* Notes and Evidence (if completed) */}
                          {step.completed && (step.notes || step.evidence) && (
                            <div className="mt-3 bg-white rounded-md p-3 border border-green-200">
                              {step.notes && (
                                <div className="mb-2">
                                  <p className="text-xs font-semibold text-gray-700 mb-1">Notes:</p>
                                  <p className="text-sm text-gray-700">{step.notes}</p>
                                </div>
                              )}
                              {step.evidence && step.evidence.length > 0 && (
                                <div>
                                  <p className="text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                                    <Paperclip size={12} />
                                    Evidence:
                                  </p>
                                  {step.evidence.map((url, idx) => (
                                    <a
                                      key={idx}
                                      href={url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-sm text-blue-600 hover:underline block"
                                    >
                                      {url}
                                    </a>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Input Fields (if not completed) */}
                          {!step.completed && (
                            <div className="mt-3 space-y-2">
                              <input
                                type="text"
                                placeholder="Add notes (optional)"
                                value={stepNotes[step.step_number] || ''}
                                onChange={(e) =>
                                  setStepNotes((prev) => ({ ...prev, [step.step_number]: e.target.value }))
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  placeholder="Evidence URL (optional)"
                                  value={evidenceUrls[step.step_number] || ''}
                                  onChange={(e) =>
                                    setEvidenceUrls((prev) => ({ ...prev, [step.step_number]: e.target.value }))
                                  }
                                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <button
                                  onClick={() => handleToggleStep(step.step_number)}
                                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium whitespace-nowrap"
                                >
                                  Mark Complete
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Completion Status */}
            {activeExecution.status === 'completed' && (
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-6 border border-green-200">
                <div className="text-center">
                  <CheckCircle size={48} className="mx-auto text-green-600 mb-3" />
                  <h3 className="text-lg font-semibold text-green-900 mb-2">SOP Execution Completed</h3>
                  <p className="text-sm text-green-700">
                    All {totalSteps} steps have been completed successfully.
                  </p>
                  {activeExecution.completed_at && (
                    <p className="text-xs text-green-600 mt-2">
                      Completed at {format(new Date(activeExecution.completed_at), 'MMM dd, yyyy HH:mm')}
                    </p>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </DetailPanel>
  );
};

export default SOPExecutionMode;
