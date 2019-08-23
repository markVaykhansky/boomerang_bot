import app from './src/App'

const envPort = process.env.PORT;

if(envPort)
  console.log("env port: " + envPort);

const port = envPort || 4000;

app.listen(port, (err) => {
  if (err) {
    return console.log(err)
  }

  return console.log(`server is listening on ${port}`)
});