const checkHealth = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/health');
    const data = await response.json();
    
    if (data.status === 'ok') {
      console.log('✅ Application is healthy');
      console.log(`🕒 Timestamp: ${data.timestamp}`);
      console.log(`🔢 Version: ${data.version}`);
      process.exit(0);
    } else {
      console.log('❌ Application is not healthy');
      process.exit(1);
    }
  } catch (error) {
    console.log('❌ Failed to reach health endpoint');
    console.log(error.message);
    process.exit(1);
  }
};

checkHealth();