import { useEffect, useState } from "react";
import { toast } from "sonner";
import Layout from "../components/Layout";
import api from "../hooks/useApi";
import LeavePolicyForm from "../components/leave-policy/LeavePolicyForm";
import LeavePolicyTable from "../components/leave-policy/LeavePolicyTable";

const LeavePolicyPage = () => {
  const [policies, setPolicies] = useState([]);
  const [editingPolicy, setEditingPolicy] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchPolicies = async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin/leave-policy");
      setPolicies(res?.data?.data || []);
    } catch (error) {
      console.error("Failed to fetch leave policies:", error);
      toast.error(error?.response?.data?.message || "Failed to fetch leave policies");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPolicies();
  }, []);

  const handleCreate = async (payload) => {
    try {
      setSubmitting(true);
      await api.post("/admin/leave-policy", payload);
      toast.success("Leave policy saved");
      fetchPolicies();
    } catch (error) {
      console.error("Failed to save leave policy:", error);
      toast.error(error?.response?.data?.message || "Failed to save leave policy");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (payload) => {
    if (!editingPolicy?.id) {
      toast.error("This policy is not created yet. Use Add Policy.");
      return;
    }
    try {
      setSubmitting(true);
      await api.put(`/admin/leave-policy/${editingPolicy.id}`, payload);
      toast.success("Leave policy updated");
      setEditingPolicy(null);
      fetchPolicies();
    } catch (error) {
      console.error("Failed to update leave policy:", error);
      toast.error(error?.response?.data?.message || "Failed to update leave policy");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leave Policy</h1>
          <p className="text-gray-600">Configure yearly leave limits and earned leave rules</p>
        </div>

        <LeavePolicyForm submitting={submitting} onSubmit={handleCreate} />

        {editingPolicy && (
          <LeavePolicyForm
            mode="edit"
            initialData={editingPolicy}
            submitting={submitting}
            onSubmit={handleEdit}
            onCancel={() => setEditingPolicy(null)}
          />
        )}

        {loading ? (
          <p className="text-gray-500">Loading leave policies...</p>
        ) : (
          <LeavePolicyTable policies={policies} onEdit={setEditingPolicy} />
        )}
      </div>
    </Layout>
  );
};

export default LeavePolicyPage;
