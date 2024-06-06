import express from 'express'
import cors from 'cors'
import terminalRoutes from './app/modules/terminal/terminal.routes.js'

const app = express();

app.use(express.json())
app.use(cors())


// app.use('/explainer', explainerRoutes);
app.use("/terminal", terminalRoutes)

app.get('/', (req, res) => {
  res.send("Hello from explainer.")
})


export default app;