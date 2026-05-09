import axiosInstance from "../../utils/axiosInstance";

/**
 * Returns the publication base path for a given project,
 * scoped to the caller's role.
 *
 * role must be "student" or "faculty".
 */
const base = (role, projectId) =>
  `/api/${role}/projects/${projectId}/publications`;

const publicationService = {

  /* ============== LIST ============ */

  listPublications: async (role, projectId) => {
    const response = await axiosInstance.get(base(role, projectId));
    return response.data;
  },

  /* ============== GET ONE ============ */

  getPublication: async (role, projectId, publicationId) => {
    const response = await axiosInstance.get(
      `${base(role, projectId)}/${publicationId}`
    );
    return response.data;
  },

  /* ============== CREATE ============ */

  // payload: { title, abstract?, authors?, status?, conference?, published? }
  createPublication: async (role, projectId, payload) => {
    const response = await axiosInstance.post(base(role, projectId), payload);
    return response.data;
  },

  /* ============== UPDATE ============ */

  // payload: any subset of { title, abstract, authors, status, conference, published }
  updatePublication: async (role, projectId, publicationId, payload) => {
    const response = await axiosInstance.patch(
      `${base(role, projectId)}/${publicationId}`,
      payload
    );
    return response.data;
  },

  /* ============== DELETE ============ */

  deletePublication: async (role, projectId, publicationId) => {
    const response = await axiosInstance.delete(
      `${base(role, projectId)}/${publicationId}`
    );
    return response.data;
  },

  /* ============== REMARKS ============ */

  // payload: { note }
  addRemark: async (role, projectId, publicationId, payload) => {
    const response = await axiosInstance.post(
      `${base(role, projectId)}/${publicationId}/remarks`,
      payload
    );
    return response.data;
  },
};

export default publicationService;