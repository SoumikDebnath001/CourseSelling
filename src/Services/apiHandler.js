

export const handleApiRequest = async (apiCall) => {
    try {

        const response = await apiCall();
        return { data: response?.data, error: null };

    } catch (error) {

        if (error?.response) {

            console.error("Server Error:", error?.response?.data);
            return {
                data: null,
                error: error?.response?.data?.message || "Server error occurred",
            };
        }
        else if (error?.request) {

            console.error("Network Error:", error?.request);
            return {
                data: null,
                error: "No response from server. Please check your network.",
            };
        }
        else {

            console.error("Error:", error?.message);
            return {
                data: null,
                error: "Something went wrong. Please try again later.",
            };

        }
    }
};