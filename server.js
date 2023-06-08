const env = require('dotenv');

env.config({ path: './config.env' });

const app = require('./app');

const port = process.env.PORT || 3000;

//////////////////////////////////Server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
