import { type FC } from 'react';
import { LecturesList } from '../components/organisms';

const LecturesPage: FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Lectures</h1>
        <p className="text-gray-600 mt-2">Schedule and manage lecture sessions</p>
      </div>
      <LecturesList />
    </div>
  );
};

export default LecturesPage;
