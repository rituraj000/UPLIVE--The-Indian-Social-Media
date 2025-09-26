// Simple test to check if posts exist and can be fetched
fetch("http://localhost:5000/api/posts/all", {
  method: "GET",
  headers: {
    "Content-Type": "application/json",
    Authorization: "Bearer " + localStorage.getItem("token"),
  },
})
  .then((response) => {
    console.log("Response status:", response.status);
    return response.json();
  })
  .then((data) => {
    console.log("Posts data:", {
      isArray: Array.isArray(data),
      count: Array.isArray(data) ? data.length : "Not array",
      firstPost: data[0] || "No posts",
      sample: data.slice(0, 2),
    });
  })
  .catch((error) => {
    console.error("Error:", error);
  });
