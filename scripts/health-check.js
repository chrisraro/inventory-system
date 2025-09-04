// Health check script for command line
const { performHealthCheck, formatHealthCheckResult } = require("./lib/health-check");

async function runHealthCheck() {
  try {
    console.log("🏥 Running application health check...");
    const result = await performHealthCheck();
    console.log(formatHealthCheckResult(result));
    
    // Exit with appropriate code
    process.exit(result.status === "healthy" ? 0 : 1);
  } catch (error) {
    console.error("❌ Health check failed:", error.message);
    process.exit(1);
  }
}

runHealthCheck();