const express = require('express')
const cors = require('cors');
const app = express();

const port = 3000;

// Enable All CORS Requests
app.use(cors());
let index=0;   
const questions = [
    { question: "What is your age?"},
    { question: "What is your monthly household income range?"},
    { question: "Could you tell us about any skin concerns you have? Like Dryness, Aging, Sensitivity, Acne" },
    { question: "Could you tell us about your skin type? " },
    { question: "How often do you use face creams? " },
    { question: "What factors do you consider when purchasing a face cream? Brand, Price, Ingredients, Recommendations, Packaging." },
    {  question: "Had you heard of Blue Lotus Face Cream before today?" },
    { question: "How did you first learn about Blue Lotus Face Cream?" },
    { question: "What words or images come to mind when you think of Blue Lotus Face Cream?" },
    { question: "What is your initial impression of Blue Lotus Face Cream?" },
    { question: "On a scale from 1 to 10, how would you rate the quality of Blue Lotus Face Cream compared to others?" },
    {question: "Describe your current skincare routine and how Blue Lotus Face Cream could fit into it." },
    {question: "On a scale from 'Not important at all' to 'Extremely important', how much value do you place on using natural or organic ingredients in your skincare products?" },
    {question: "In what ways do you think a premium face cream like Blue Lotus can enhance your skincare experience?" },
    {question: "How does your lifestyle influence your choices in skincare products?" },
    { question: "Can you share a recent experience where you felt the need for a high-quality face cream?" },
    {question: "How does Blue Lotus Face Cream stand out from its competitors, in your opinion?" },
    {question: "Have you ever switched from one brand to another for face creams? If so, what motivated the switch?" },
    {question: "If you have used Blue Lotus Face Cream before, describe your experience and the outcomes you noticed." },
    { question: "From very poor value to excellent value, how would you rate the value for money of Blue Lotus Face Cream?" },
    {question: "Can you recall any advertising or marketing for Blue Lotus Face Cream that resonated with you? Why?" },
    {question: "Looking to the future, how do you see Blue Lotus Face Cream fitting into your evolving skincare needs and preferences?" }
];
app.use(express.json());   
app.post('/getNextQuestion', (req, res) => { 
    //const functionName = req.body.message.functionCall.name;
    //console.log('Function Name:', functionName);
    // Accessing the parameters of the function call
    const parameters = req.body.message?.functionCall?.parameters;
    console.log('Parameters:', parameters);
    if(!parameters) index=0;
    // Correctly reference parameters.changedPreviousResponse in the if condition
    if (parameters && parameters.changedPreviousResponse && parameters.changedPreviousResponse == true) {
        console.log(parameters.PreviousResponseFieldAndValueChanges);
        res.status(200).send({ResponseUpdated:"Success", question:questions[index]});
    }
    else
    {
    console.log(questions[index]) 
    if(!questions[index])index=0;
    res.status(200).send({question:questions[index]});
    index++; 
    }
  });
  app.post('/updatePreviousAnswer', (req, res) => {
    console.log(req.body);
    res.status(200).send('update Success');
    index++;
  })
  app.get('/', (req, res) => { 
    res.json({price:'23 USD'});
  })
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
