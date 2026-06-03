const sequelize = require('./config/database');

async function cleanup() {
  try {
    const [results] = await sequelize.query('SHOW INDEX FROM users');
    
    // Find all duplicate indices like uuid_2, email_2, etc.
    const indicesToDrop = results
      .map(r => r.Key_name)
      .filter(name => (name.startsWith('uuid_') || name.startsWith('email_')) && name !== 'PRIMARY');
    
    // Unique the names because a composite index would show up multiple times, though these are single col
    const uniqueIndices = [...new Set(indicesToDrop)];

    for (let index of uniqueIndices) {
      console.log(`Dropping index ${index}...`);
      await sequelize.query(`ALTER TABLE users DROP INDEX ${index}`);
    }

    console.log('Cleanup complete!');
    process.exit(0);
  } catch(e) {
    console.error(e);
    process.exit(1);
  }
}
cleanup();
