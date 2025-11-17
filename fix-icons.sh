#!/bin/bash

# Fix @heroicons imports to lucide-react equivalents

FILES=$(find ./src -name "*.tsx" -type f -exec grep -l "@heroicons/react" {} \;)

for file in $FILES; do
  echo "Fixing $file..."

  # Replace import statements
  sed -i "s/@heroicons\/react\/24\/outline/lucide-react/g" "$file"
  sed -i "s/@heroicons\/react\/24\/solid/lucide-react/g" "$file"

  # Replace icon names
  sed -i "s/ChartBarSquareIcon/BarChart3/g" "$file"
  sed -i "s/ArrowsPointingOutIcon/Maximize/g" "$file"
  sed -i "s/ArrowPathIcon/RefreshCw/g" "$file"
  sed -i "s/Cog6ToothIcon/Settings/g" "$file"
  sed -i "s/ArrowTrendingUpIcon/TrendingUp/g" "$file"
  sed -i "s/ArrowTrendingDownIcon/TrendingDown/g" "$file"
  sed -i "s/MinusIcon/Minus/g" "$file"
  sed -i "s/XMarkIcon/X/g" "$file"
  sed -i "s/ArrowsRightLeftIcon/ArrowRightLeft/g" "$file"
  sed -i "s/PlusIcon/Plus/g" "$file"
  sed -i "s/PencilIcon/Edit/g" "$file"
  sed -i "s/TrashIcon/Trash2/g" "$file"
  sed -i "s/CheckIcon/Check/g" "$file"
  sed -i "s/ChevronDownIcon/ChevronDown/g" "$file"
  sed -i "s/ChevronUpIcon/ChevronUp/g" "$file"
  sed -i "s/ChevronRightIcon/ChevronRight/g" "$file"
  sed -i "s/ClockIcon/Clock/g" "$file"
  sed -i "s/CalendarIcon/Calendar/g" "$file"
  sed -i "s/UserIcon/User/g" "$file"
  sed -i "s/UsersIcon/Users/g" "$file"
  sed -i "s/DocumentTextIcon/FileText/g" "$file"
  sed -i "s/MagnifyingGlassIcon/Search/g" "$file"
  sed -i "s/PaperClipIcon/Paperclip/g" "$file"
  sed -i "s/InformationCircleIcon/Info/g" "$file"
  sed -i "s/ExclamationTriangleIcon/AlertTriangle/g" "$file"
  sed -i "s/CheckCircleIcon/CheckCircle/g" "$file"
  sed -i "s/XCircleIcon/XCircle/g" "$file"
  sed -i "s/BellIcon/Bell/g" "$file"
  sed -i "s/CurrencyDollarIcon/DollarSign/g" "$file"
  sed -i "s/ShieldCheckIcon/ShieldCheck/g" "$file"
  sed -i "s/BookOpenIcon/BookOpen/g" "$file"
  sed -i "s/Cog6ToothIconIcon/Settings/g" "$file"

  echo "Fixed $file"
done

echo "All files fixed!"
