import { type FC } from 'react';
import { ModulesList } from '../components/organisms';

const ModulesPage: FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Modules</h1>
        <p className="text-gray-600 mt-2">Manage course modules and student enrollments</p>
      </div>
      <ModulesList />
    </div>
  );
};

export default ModulesPage;
