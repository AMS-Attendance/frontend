import { useState, useEffect, type FC } from "react";
import axios from "axios";
import StudentPicker from "./StudentPicker";
import { Calendar, MapPin, SquarePen, Trash2, UsersRound, BookmarkCheck, Trash, Loader, Plus } from "lucide-react";
import LiveAttendanceMonitor from "./LiveAttendanceMonitor";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

const API_URL = import.meta.env.VITE_BASE_URL || "http://localhost:8000/api";

interface Module {
  id: string;
  code: string;
  name: string;
  credits: number;
  semester: string;
  students: Student[];
}

interface Lecture {
  id: string;
  moduleId: string;
  module?: Module;
  title: string;
  scheduledDate: string;
  scheduledTime: string;
  duration: number;
  location?: string;
  description?: string;
  status?: "SCHEDULED" | "COMPLETED" | "CANCELLED" | "OTHER";
  type?: "LECTURE" | "LAB" | "TUTORIAL" | "OTHER";
}

interface Student {
  id: string;
  name: string;
  email: string;
  index_number: string;
  batch: number;
  degree: string;
}

const LecturerDashboard: FC = () => {
  const [activeTab, setActiveTab] = useState<
    "lectures" | "modules" | "students"
  >("lectures");
  const [modules, setModules] = useState<Module[]>([]);
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);

  // Filters
  const [selectedModule, setSelectedModule] = useState<string>("");
  const [selectedBatch, setSelectedBatch] = useState<string>("");
  const [batches, setBatches] = useState<string[]>([]);

  // Lecture Form
  const [showLectureForm, setShowLectureForm] = useState(false);
  const [editingLecture, setEditingLecture] = useState<Lecture | null>(null);
  const [lectureForm, setLectureForm] = useState({
    moduleId: "",
    title: "",
    scheduledDate: "",
    scheduledTime: "",
    duration: 2,
    location: "",
    description: "",
    type: "LECTURE",
    status: "SCHEDULED"
  });

  // Module Form
  const [showModuleForm, setShowModuleForm] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [moduleForm, setModuleForm] = useState({
    code: "",
    name: "",
    credits: 3,
    semester: "1",
    description: "",
  });
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedLiveLecture, setSelectedLiveLecture] = useState<{ id: string, title: string } | null>(null);

  useEffect(() => {
    fetchModules();
    fetchLectures();
  }, []);

  useEffect(() => {
    if (selectedModule) {
      fetchStudentsByModule(selectedModule);
    } else if (selectedBatch) {
      fetchStudentsByBatch(selectedBatch);
    } else {
      setFilteredStudents([]);
    }
  }, [selectedModule, selectedBatch]);

  const fetchModules = async () => {
    try {
      const response = await axios.get(`${API_URL}/modules/my-modules`, {
        withCredentials: true,
      });
      setModules(response.data.data || []);
    } catch (err: unknown) {
      console.error("Error fetching modules:", err);
      setError("Failed to load modules");
    }
  };

  const fetchLectures = async () => {
    try {
      const response = await axios.get(`${API_URL}/lectures`, {
        withCredentials: true,
      });
      console.log("Fetched lectures:", response.data.data);

      // Map backend snake_case to frontend camelCase
      const mappedLectures: Lecture[] = (response.data.data || []).map((l: any) => ({
        id: l.id,
        moduleId: l.module_id,
        module: l.module,
        title: l.title || "Untitled Lecture", // fallback
        scheduledDate: l.scheduled_at ? l.scheduled_at.split('T')[0] : "",
        scheduledTime: l.scheduled_at ? l.scheduled_at.split('T')[1].substring(0, 5) : "",
        duration: l.duration_hours ? parseInt(l.duration_hours) : 2,
        location: l.location,
        description: l.description,
        status: l.status,
        type: l.type
      }));

      setLectures(mappedLectures);
    } catch (err: unknown) {
      console.error("Error fetching lectures:", err);
    }
  };

  const fetchStudentsByModule = async (moduleId: string) => {
    try {
      const response = await axios.get(`${API_URL}/modules/${moduleId}`, {
        withCredentials: true,
      });
      const studentList = response.data.data?.students || [];
      setFilteredStudents(studentList);

      // Extract unique batches
      const uniqueBatches = [
        ...new Set(studentList.map((s: Student) => s.batch)),
      ]
        .filter(Boolean)
        .map(String);
      setBatches(uniqueBatches);
    } catch (err: unknown) {
      console.error("Error fetching students:", err);
      setError("Failed to load students");
    }
  };

  const fetchStudentsByBatch = async (batch: string) => {
    try {
      const response = await axios.get(
        `${API_URL}/users/students?batch=${batch}`,
        {
          withCredentials: true,
        },
      );
      setFilteredStudents(response.data.data || []);
    } catch (err: unknown) {
      console.error("Error fetching students:", err);
      setError("Failed to load students by batch");
    }
  };

  const handleLectureFormChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    setLectureForm({ ...lectureForm, [e.target.name]: e.target.value });
  };

  const handleCreateLecture = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (
      !lectureForm.moduleId ||
      !lectureForm.title ||
      !lectureForm.scheduledDate ||
      !lectureForm.scheduledTime || !lectureForm.type || !lectureForm.duration || !lectureForm.location || !lectureForm.status
    ) {
      setError("Please fill all required fields");
      return;
    }

    try {
      setLoading(true);

      if (editingLecture) {
        // Update existing lecture
        await axios.put(
          `${API_URL}/lectures/${editingLecture.id}`,
          lectureForm,
          {
            withCredentials: true,
          },
        );
        setSuccess("Lecture updated successfully!");
      } else {
        // Create new lecture
        console.log("Creating lecture:", lectureForm);
        await axios.post(`${API_URL}/lectures`, lectureForm, {
          withCredentials: true,
        });
        setSuccess("Lecture created successfully!");
      }

      // Reset form
      setLectureForm({
        moduleId: "",
        title: "",
        scheduledDate: "",
        scheduledTime: "",
        duration: 2,
        location: "",
        description: "",
        type: "",
        status: "SCHEDULED"
      });
      setShowLectureForm(false);
      setEditingLecture(null);
      fetchLectures();
    } catch (err: unknown) {
      console.error("Error saving lecture:", err);

      // Extract detailed error information
      const axiosError = err as {
        response?: {
          data?: { message?: string; error?: string };
          status?: number;
          statusText?: string;
        };
        request?: unknown;
        message?: string;
      };

      let errorMessage = "Failed to save lecture";

      if (axiosError.response) {
        // Server responded with error
        const status = axiosError.response.status;
        const data = axiosError.response.data;

        errorMessage =
          data?.message ||
          data?.error ||
          axiosError.response.statusText ||
          errorMessage;

        console.error("Server error response:", {
          status,
          statusText: axiosError.response.statusText,
          data: axiosError.response.data,
        });

        // Add specific error context
        if (status === 400) {
          if (
            errorMessage.includes("Module not found") ||
            errorMessage.includes("Invalid moduleId")
          ) {
            errorMessage = `Invalid module selected. ${errorMessage}`;
          } else if (
            errorMessage.includes("End time must be after start time")
          ) {
            errorMessage =
              "End time must be after start time. Please check your lecture schedule.";
          } else if (errorMessage.includes("date format")) {
            errorMessage =
              "Invalid date/time format. Please select valid dates.";
          } else if (errorMessage.includes("Invalid lecture type")) {
            errorMessage = "Invalid lecture type selected.";
          } else if (errorMessage.includes("required fields")) {
            errorMessage =
              "Please fill all required fields: Module, Start Time, End Time, and Location.";
          }
        } else if (status === 401) {
          errorMessage = "Authentication failed. Please login again.";
        } else if (status === 403) {
          errorMessage =
            "Access denied. You do not have permission to create/edit lectures for this module.";
        } else if (status === 404) {
          errorMessage = "Module not found. Please select a valid module.";
        } else if (status === 500) {
          errorMessage = `Server error: ${errorMessage}. Please try again later.`;
        }
      } else if (axiosError.request) {
        // Request made but no response
        errorMessage =
          "No response from server. Please check your connection and try again.";
        console.error("No response received:", axiosError.request);
      } else {
        // Error setting up request
        errorMessage = axiosError.message || errorMessage;
        console.error("Request setup error:", axiosError.message);
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleEditLecture = (lecture: Lecture) => {
    setEditingLecture(lecture);
    setLectureForm({
      moduleId: lecture.moduleId,
      title: lecture.title,
      scheduledDate: lecture.scheduledDate,
      scheduledTime: lecture.scheduledTime,
      duration: lecture.duration,
      location: lecture.location || "",
      description: lecture.description || "",
      type: lecture.type || "LECTURE",
      status: lecture.status || "SCHEDULED",
    });
    setShowLectureForm(true);
  };

  const handleDeleteLecture = async (lectureId: string) => {
    if (!confirm("Are you sure you want to delete this lecture?")) return;

    try {
      await axios.delete(`${API_URL}/lectures/${lectureId}`, {
        withCredentials: true,
      });
      setSuccess("Lecture deleted successfully!");
      fetchLectures();
    } catch (err: unknown) {
      console.error("Error deleting lecture:", err);
      const axiosError = err as { response?: { data?: { message?: string } } };
      const errorMessage =
        axiosError.response?.data?.message || "Failed to delete lecture";
      setError(errorMessage);
    }
  };

  // Module CRUD Functions
  const handleModuleFormChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    setModuleForm({
      ...moduleForm,
      [name]: name === "credits" ? Number(value) : value,
    });
  };

  const handleCreateModule = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!moduleForm.code || !moduleForm.name) {
      setError("Please fill all required fields");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        ...moduleForm,
        studentList: selectedStudentIds,
      };

      if (editingModule) {
        // Update existing module
        console.log("Updating module:", { id: editingModule.id, payload });
        const response = await axios.put(
          `${API_URL}/modules/${editingModule.id}`,
          payload,
          { withCredentials: true },
        );
        console.log("Module update response:", response.data);
        setSuccess(
          `Module updated successfully! ${selectedStudentIds.length} students enrolled.`,
        );
      } else {
        // Create new module (lecturerId is automatically set by backend from auth token)
        console.log("Creating module:", {
          code: payload.code,
          name: payload.name,
          credits: payload.credits,
          semester: payload.semester,
          studentCount: payload.studentList.length,
          description: payload.description || "(none)",
        });

        const response = await axios.post(`${API_URL}/modules`, payload, {
          withCredentials: true,
        });

        console.log("Module creation response:", response.data);
        setSuccess(
          `Module created successfully! ${selectedStudentIds.length} students enrolled.`,
        );
      }

      setModuleForm({
        code: "",
        name: "",
        credits: 3,
        semester: "1",
        description: "",
      });
      setSelectedStudentIds([]);
      setShowModuleForm(false);
      setEditingModule(null);
      fetchModules();
    } catch (err: unknown) {
      console.error("Error saving module:", err);

      // Extract detailed error information
      const axiosError = err as {
        response?: {
          data?: { message?: string; error?: string };
          status?: number;
          statusText?: string;
        };
        request?: unknown;
        message?: string;
      };

      let errorMessage = "Failed to save module";

      if (axiosError.response) {
        // Server responded with error
        const status = axiosError.response.status;
        const data = axiosError.response.data;

        errorMessage =
          data?.message ||
          data?.error ||
          axiosError.response.statusText ||
          errorMessage;

        console.error("Server error response:", {
          status,
          statusText: axiosError.response.statusText,
          data: axiosError.response.data,
        });

        // Add specific error context
        if (status === 400) {
          if (errorMessage.includes("already exists")) {
            errorMessage = `Module code "${moduleForm.code}" already exists. Please use a different code.`;
          } else if (errorMessage.includes("invalid student")) {
            errorMessage = `Some selected students are invalid or no longer exist. Please refresh and reselect students.`;
          } else if (errorMessage.includes("lecturer")) {
            errorMessage = `Invalid lecturer assignment. ${errorMessage}`;
          }
        } else if (status === 401) {
          errorMessage = "Authentication failed. Please login again.";
        } else if (status === 403) {
          errorMessage = "You do not have permission to perform this action.";
        } else if (status === 500) {
          errorMessage = `Server error: ${errorMessage}. Please try again later.`;
        }
      } else if (axiosError.request) {
        // Request made but no response
        errorMessage =
          "No response from server. Please check your connection and try again.";
        console.error("No response received:", axiosError.request);
      } else {
        // Error setting up request
        errorMessage = axiosError.message || errorMessage;
        console.error("Request setup error:", axiosError.message);
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleEditModule = (module: Module) => {
    setEditingModule(module);
    setModuleForm({
      code: module.code,
      name: module.name,
      credits: module.credits,
      semester: module.semester,
      description: "",
    });
    setSelectedStudentIds(module.students?.map((s) => s.id) || []);
    setShowModuleForm(true);
  };

  const handleDeleteModule = async (moduleId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this module? This will also delete all associated lectures.",
      )
    )
      return;

    try {
      await axios.delete(`${API_URL}/modules/${moduleId}`, {
        withCredentials: true,
      });
      setSuccess("Module deleted successfully!");
      fetchModules();
    } catch (err: unknown) {
      console.error("Error deleting module:", err);
      const axiosError = err as { response?: { data?: { message?: string } } };
      const errorMessage =
        axiosError.response?.data?.message || "Failed to delete module";
      setError(errorMessage);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {selectedLiveLecture && (
        <LiveAttendanceMonitor
          lectureId={selectedLiveLecture.id}
          lectureTitle={selectedLiveLecture.title}
          onClose={() => setSelectedLiveLecture(null)}
        />
      )}
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Lecturer Dashboard
          </h1>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab("lectures")}
                className={`px-6 py-4 text-sm font-medium border-b-2 ${activeTab === "lectures"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
              >
                Lectures
              </button>
              <button
                onClick={() => setActiveTab("modules")}
                className={`px-6 py-4 text-sm font-medium border-b-2 ${activeTab === "modules"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
              >
                My Modules
              </button>
              <button
                onClick={() => setActiveTab("students")}
                className={`px-6 py-4 text-sm font-medium border-b-2 ${activeTab === "students"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
              >
                Students
              </button>
            </nav>
          </div>

          {/* Alerts */}
          {error && (
            <div className="m-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}
          {success && (
            <div className="m-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
              {success}
            </div>
          )}

          {/* Lectures Tab */}
          {activeTab === "lectures" && (
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">
                  Manage Lectures
                </h2>
                <Dialog open={showLectureForm} onOpenChange={setShowLectureForm}>
                  <DialogTrigger asChild>
                    <Button
                      onClick={() => {
                        setEditingLecture(null);
                        setLectureForm({
                          moduleId: "",
                          title: "",
                          scheduledDate: "",
                          scheduledTime: "",
                          duration: 2,
                          location: "",
                          description: "",
                          type: "LECTURE",
                          status: "SCHEDULED",
                        });
                      }}
                    >
                      <Plus className="w-4 h-4" />
                      Create New Lecture
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>
                        {editingLecture ? "Edit Lecture" : "Create New Lecture"}
                      </DialogTitle>
                      <DialogDescription>
                        {editingLecture ? "Update lecture details below" : "Fill in the details to create a new lecture"}
                      </DialogDescription>
                    </DialogHeader>

                    {/* Lecture Form */}
                    <form
                      onSubmit={handleCreateLecture}
                      className=" p-6 "
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Module *
                          </label>
                          <select
                            name="moduleId"
                            value={lectureForm.moduleId}
                            onChange={handleLectureFormChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          >
                            <option value="">Select Module</option>
                            {modules.map((module) => (
                              <option key={module.id} value={module.id}>
                                {module.code} - {module.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Title *
                          </label>
                          <input
                            type="text"
                            name="title"
                            value={lectureForm.title}
                            onChange={handleLectureFormChange}
                            placeholder="e.g., Introduction to Variables"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Date *
                          </label>
                          <input
                            type="date"
                            name="scheduledDate"
                            value={lectureForm.scheduledDate}
                            onChange={handleLectureFormChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Time *
                          </label>
                          <input
                            type="time"
                            name="scheduledTime"
                            value={lectureForm.scheduledTime}
                            onChange={handleLectureFormChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Duration (hours) *
                          </label>
                          <input
                            type="number"
                            name="duration"
                            value={lectureForm.duration}
                            onChange={handleLectureFormChange}
                            min="1"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Location
                          </label>
                          <input
                            type="text"
                            name="location"
                            value={lectureForm.location}
                            onChange={handleLectureFormChange}
                            placeholder="e.g., Hall A, Lab 3"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Description
                          </label>
                          <textarea
                            name="description"
                            value={lectureForm.description}
                            onChange={handleLectureFormChange}
                            rows={3}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Type
                          </label>
                          <select
                            name="type"
                            value={lectureForm.type}
                            onChange={handleLectureFormChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="LECTURE">Lecture</option>
                            <option value="LAB">Lab</option>
                            <option value="TUTORIAL">Tutorial</option>
                            <option value="OTHER">Other</option>
                          </select>
                        </div>
                      </div>
                      <div className="flex gap-4 mt-6">
                        <Button
                          type="submit"
                          disabled={loading}
                        >
                          {loading && <Loader className="w-4 h-4 animate-spin" />}
                          {loading
                            ? "Saving..."
                            : editingLecture
                              ? "Update Lecture"
                              : "Create Lecture"}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setShowLectureForm(false);
                            setEditingLecture(null);
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Lectures List */}
              <div className="flex w-full justify-center items-start gap-5 flex-wrap">
                {lectures.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    No lectures found. Create one to get started!
                  </p>
                ) : (
                  lectures.map((lecture) => (
                    <div
                      key={lecture.id}
                      className="w-full max-w-sm border border-gray-200 rounded-lg p-5 shadow-sm hover:shadow-lg transition"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-800">
                            {lecture.title}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {lecture.module?.code} - {lecture.module?.name}
                          </p>

                          <div className="mt-3 space-y-2 text-sm text-gray-700">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-gray-500" />
                              {new Date(
                                lecture.scheduledDate,
                              ).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}{" "}
                              • {lecture.scheduledTime} ({lecture.duration}{" "}
                              min)
                            </div>
                            {lecture.location && (
                              <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-gray-500" />
                                {lecture.location}
                              </div>
                            )}
                            {lecture.description && (
                              <p className="flex gap-1">
                                <span className="text-gray-500">📝</span>{" "}
                                {lecture.description}
                              </p>
                            )}
                          </div>

                          <div className="mt-3 flex gap-2">
                            {lecture.status === "COMPLETED" && (
                              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-md">
                                Completed
                              </span>
                            )}
                            {lecture.status === "CANCELLED" && (
                              <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-md">
                                Cancelled
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 ml-3">
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => handleEditLecture(lecture)}
                            className="bg-yellow-500 hover:bg-yellow-600 text-white border-yellow-500"
                            title="Edit Lecture"
                          >
                            <SquarePen className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => setSelectedLiveLecture({ id: lecture.id, title: lecture.title })}
                            className="bg-blue-500 hover:bg-blue-600 text-white border-blue-500"
                            title="Live Attendance Mode"
                          >
                            <UsersRound className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="destructive"
                            onClick={() => handleDeleteLecture(lecture.id)}
                            title="Delete Lecture"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Modules Tab */}
          {activeTab === "modules" && (
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">My Modules</h2>

                <Dialog open={showModuleForm} onOpenChange={setShowModuleForm}>
                  <DialogTrigger asChild>
                    <Button
                      onClick={() => {
                        setEditingModule(null);
                        setModuleForm({
                          code: "",
                          name: "",
                          credits: 3,
                          semester: "1",
                          description: "",
                        });
                        setSelectedStudentIds([]);
                      }}
                    >
                      <Plus className="w-4 h-4" />
                      Create New Module
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>
                        {editingModule ? "Edit Module" : "Create New Module"}
                      </DialogTitle>
                      <DialogDescription>
                        {editingModule ? "Update module details and student enrollment" : "Fill in the details to create a new module and enroll students"}
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreateModule} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Module Code *
                          </label>
                          <input
                            type="text"
                            name="code"
                            value={moduleForm.code}
                            onChange={handleModuleFormChange}
                            placeholder="e.g., CS1001"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Module Name *
                          </label>
                          <input
                            type="text"
                            name="name"
                            value={moduleForm.name}
                            onChange={handleModuleFormChange}
                            placeholder="e.g., Introduction to Programming"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Credits
                          </label>
                          <input
                            type="number"
                            name="credits"
                            value={moduleForm.credits}
                            onChange={handleModuleFormChange}
                            min="1"
                            max="10"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Semester
                          </label>
                          <select
                            name="semester"
                            value={moduleForm.semester}
                            onChange={handleModuleFormChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                              <option key={sem} value={sem}>
                                {sem}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Description
                          </label>
                          <textarea
                            name="description"
                            value={moduleForm.description}
                            onChange={handleModuleFormChange}
                            rows={3}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>

                      <div>
                        <StudentPicker
                          selectedStudents={selectedStudentIds}
                          onStudentsChange={setSelectedStudentIds}
                        />
                      </div>

                      <div className="flex gap-4">
                        <Button
                          type="submit"
                          disabled={loading}
                        >
                          {loading && <Loader className="w-4 h-4 animate-spin" />}
                          {loading
                            ? "Saving..."
                            : editingModule
                              ? "Update Module"
                              : "Create Module"}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setShowModuleForm(false);
                            setEditingModule(null);
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
              {/* Modules Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {modules.length === 0 ? (
                  <p className="text-gray-500 col-span-full text-center py-8">
                    No modules assigned yet. Create one to get started!
                  </p>
                ) : (
                  modules.map((module) => (
                    <div
                      key={module.id}
                      className="border border-gray-200 rounded-lg p-5 hover:shadow-lg transition bg-white cursor-pointer"
                      onClick={() => handleEditModule(module)}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-lg font-bold text-gray-900">
                              {module.code}
                            </h3>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Sem {module.semester}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 leading-snug">
                            {module.name}
                          </p>
                        </div>
                        <div className="flex gap-1.5 ml-2">

                          <Button
                            size="icon"
                            variant="destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteModule(module.id);
                            }}
                            title="Delete Module"
                          >
                            <Trash className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-gray-100">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="flex items-center gap-2 text-sm">
                            <span className="flex gap-2 items-center justify-center text-gray-500"><BookmarkCheck className="w-4 h-4" /> Credits:</span>
                            <span className="font-semibold text-gray-900">
                              {module.credits}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <span className="flex gap-2 items-center justify-center text-gray-500"><UsersRound className="w-4 h-4" /> Students:</span>
                            <span
                              className={`font-bold ${(module.students?.length || 0) > 0 ? "text-green-600" : "text-gray-400"}`}
                            >
                              {module.students?.length || 0}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Students Tab */}
          {activeTab === "students" && (
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">
                Student List
              </h2>

              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Filter by Module
                  </label>
                  <select
                    value={selectedModule}
                    onChange={(e) => {
                      setSelectedModule(e.target.value);
                      setSelectedBatch("");
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Module</option>
                    {modules.map((module) => (
                      <option key={module.id} value={module.id}>
                        {module.code} - {module.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Filter by Batch
                  </label>
                  <select
                    value={selectedBatch}
                    onChange={(e) => {
                      setSelectedBatch(e.target.value);
                      setSelectedModule("");
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Batch</option>
                    {batches.map((batch) => (
                      <option key={batch} value={batch}>
                        Batch {batch}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Students Table */}
              {filteredStudents.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No students found. Select a module or batch to view students.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white border border-gray-200">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                          Index Number
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                          Name
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                          Email
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                          Batch
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                          Degree
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStudents.map((student) => (
                        <tr
                          key={student.id}
                          className="border-t border-gray-200 hover:bg-gray-50"
                        >
                          <td className="px-4 py-3 text-sm text-gray-800">
                            {student.index_number}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-800">
                            {student.name}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {student.email}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {student.batch}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {student.degree}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="mt-4 text-sm text-gray-600">
                    Total: {filteredStudents.length} student(s)
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LecturerDashboard;
