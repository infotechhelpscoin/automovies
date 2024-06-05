import express from 'express'
import cors from 'cors'
import explainerRoutes from './app/modules/explainer/explainer.route.js';
const app = express();

app.use(express.json())
app.use(cors())


app.use('/explainer', explainerRoutes);

app.get('/', (req, res) => {
  res.send("Hello from explainer.")
})


export default app;