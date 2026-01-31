import { type FC } from 'react';
import { Card, Badge } from '../atoms';
import { type Lecture } from '../../types';
import { Calendar, Clock, MapPin, BookOpen } from 'lucide-react';

export interface LectureCardProps {
  lecture: Lecture;
  onClick?: () => void;
  showModule?: boolean;
}

const LectureCard: FC<LectureCardProps> = ({ lecture, onClick, showModule = true }) => {
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (time: string) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <Card hover={!!onClick} className={onClick ? 'cursor-pointer' : ''} onClick={onClick}>
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <h3 className="font-semibold text-gray-900">{lecture.title}</h3>
          {lecture.status && (
            <Badge
              variant={
                lecture.status === 'completed'
                  ? 'success'
                  : lecture.status === 'cancelled'
                  ? 'error'
                  : lecture.status === 'ongoing'
                  ? 'warning'
                  : 'default'
              }
              size="sm"
            >
              {lecture.status}
            </Badge>
          )}
        </div>

        {showModule && lecture.module && (
          <div className="flex items-center gap-1.5 text-sm text-gray-600">
            <BookOpen className="w-4 h-4" />
            <span>
              {lecture.module.code} - {lecture.module.name}
            </span>
          </div>
        )}

        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4" />
            <span>{formatDate(lecture.scheduled_date)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            <span>
              {formatTime(lecture.scheduled_time)} ({lecture.duration} min)
            </span>
          </div>
          {lecture.location && (
            <div className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4" />
              <span>{lecture.location}</span>
            </div>
          )}
        </div>

        {lecture.description && (
          <p className="text-sm text-gray-500 line-clamp-2">{lecture.description}</p>
        )}
      </div>
    </Card>
  );
};

export default LectureCard;
