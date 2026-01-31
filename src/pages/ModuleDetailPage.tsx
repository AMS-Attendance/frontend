import { type FC } from 'react';
import { useParams } from 'react-router-dom';
import { StudentEnrollment } from '../components/organisms';
import { Button } from '../components/atoms';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ModuleDetailPage: FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  if (!id) {
    return <div>Module ID not found</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Button
        variant="outline"
        onClick={() => navigate('/modules')}
        leftIcon={<ArrowLeft />}
        className="mb-6"
      >
        Back to Modules
      </Button>
      <StudentEnrollment moduleId={id} />
    </div>
  );
};

export default ModuleDetailPage;
