
import { axiosInstance } from "./axios";
import { handleApiRequest } from "./apiHandler";

//========================================================================================= Super Admin API Calls
export const registerSuperAdmin = async (data) => {
  return handleApiRequest(() => axiosInstance("SuperAdmin").post(`superadmin/register`, data));
};
export const loginSuperAdmin = async (data) => {
  return handleApiRequest(() => axiosInstance("SuperAdmin").post(`superadmin/login`, data));
};
export const verifySuperAdminOtp = async (data) => {
  return handleApiRequest(() => axiosInstance("SuperAdmin").post(`superadmin/verifyOtp`, data));
};
export const getSuperAdminProfile = async () => {
  return handleApiRequest(() => axiosInstance("SuperAdmin").get(`superadmin/getMyProfile`));
};

//========================================================================================= Hotel Admin API Calls
export const loginHotelAdmin = async (data) => {
  return handleApiRequest(() => axiosInstance("Admin").post(`admin/login`, data));
};
export const changeAdminPassword = async (data) => {
  return handleApiRequest(() => axiosInstance("Admin").post(`admin/changePassword`, data));
};
export const getAdminProfile = async () => {
  return handleApiRequest(() => axiosInstance("Admin").get(`admin/getMyProfile`));
};

//========================================================================================= User API Calls
export const registerUser = async (data) => {
  return handleApiRequest(() => axiosInstance("User").post(`user/register`, data));
};
export const loginUser = async (data) => {
  return handleApiRequest(() => axiosInstance("User").post(`user/login`, data));
};
export const forgotUserPassword = async (data) => {
  return handleApiRequest(() => axiosInstance("User").post(`user/forgotPassword`, data));
};
export const verifyUserOtp = async (data) => {
  return handleApiRequest(() => axiosInstance("User").post(`user/verifyOtp`, data));
};
export const changeUserPassword = async (data) => {
  return handleApiRequest(() => axiosInstance("User").post(`user/changePassword`, data));
};
export const getUserProfile = async () => {
  return handleApiRequest(() => axiosInstance("User").get(`user/getMyProfile`));
};
export const updateUserProfile = async (data) => {
  return handleApiRequest(() => axiosInstance("User").post(`user/updateMyProfile`, data));
};

//========================================================================================= Employee / Manager API Calls
export const registerEmployee = async (data) => {
  return handleApiRequest(() => axiosInstance("Employee").post(`employee/register`, data));
};
export const loginEmployee = async (data) => {
  return handleApiRequest(() => axiosInstance("Employee").post(`employee/login`, data));
};
export const forgotEmployeePassword = async (data) => {
  return handleApiRequest(() => axiosInstance("Employee").post(`employee/forgotPassword`, data));
};
export const verifyEmployeeOtp = async (data) => {
  return handleApiRequest(() => axiosInstance("Employee").post(`employee/verifyOtp`, data));
};
export const changeEmployeePassword = async (data) => {
  return handleApiRequest(() => axiosInstance("Employee").post(`employee/changePassword`, data));
};
export const getEmployeeProfile = async () => {
  return handleApiRequest(() => axiosInstance("Employee").get(`employee/getMyProfile`));
};

