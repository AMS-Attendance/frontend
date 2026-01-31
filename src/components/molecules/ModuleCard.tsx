import { type FC } from 'react';
import { Card, Badge } from '../atoms';
import { type Module } from '../../types';
import { BookOpen, User } from 'lucide-react';

export interface ModuleCardProps {
  module: Module;
  onClick?: () => void;
  showLecturer?: boolean;
}

const ModuleCard: FC<ModuleCardProps> = ({ module, onClick, showLecturer = true }) => {
  return (
    <Card
      hover={!!onClick}
      className={onClick ? 'cursor-pointer' : ''}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          <div className="p-2 bg-blue-100 rounded-lg">
            <BookOpen className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-gray-900">{module.name}</h3>
              <Badge variant="info" size="sm">
                {module.code}
              </Badge>
            </div>
            {showLecturer && module.lecturer && (
              <div className="flex items-center gap-1.5 text-sm text-gray-600 mt-2">
                <User className="w-4 h-4" />
                <span>{module.lecturer.name}</span>
              </div>
            )}
            {module.student_count !== undefined && (
              <p className="text-sm text-gray-500 mt-2">
                {module.student_count} student{module.student_count !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ModuleCard;
