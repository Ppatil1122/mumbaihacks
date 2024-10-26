const express = require("express");
const app = express();
const mysql = require("mysql");
const path = require("path");
const multer = require("multer");


const {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} = require("@google/generative-ai");

const xlsx = require('xlsx');

const apiKey = "AIzaSyDTeERX4PImQvRq0x-x8-EUlTg7cyNyHRg";
const genAI = new GoogleGenerativeAI(apiKey);


const model = genAI.getGenerativeModel({
  model: 'gemini-1.5-flash',
});

const generationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 64,
  maxOutputTokens: 8192,
  responseMimeType: 'text/plain',
};

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './uploads'); // Set the destination folder for uploads
  },
  filename: function (req, file, cb) {
    // Create a unique filename with user ID and original name
    cb(null, `${file.originalname}`);
  }
});

const upload = multer({storage: storage});
// const fileManager = new GoogleAIFileManager(apiKey)
// Setup your MySQL connection here
const connection = mysql.createConnection({
    host: "localhost",
    user: "root",
    database: "finance",
    password: "Tejas@6504"
});

// Middlewares
app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "/public")));

// Routes
// app.get("/",)
app.get('/main',(req, res) => {
    res.render("index.ejs");
});

app.post("/main/new",(req, res) => {
    let {fullName,phone,email,investmentCapacity,sectors,investmentStyle,investmentHorizon} = req.body;

    console.log(req.body);

    try{
        connection.query("insert into investor(Name_of_investor,email_of_investor,phone_of_investor,investmentCapacity,sectors,investmentHorizon) values (?,?,?,?,?,?)",[req.body.fullName,req.body.email,req.body.phone,req.body.investmentCapacity,req.body.sectors,req.body.investmentHorizon],(err1,result1) => {
            if(err1) throw err1;


            connection.query("select * from investor where Name_of_investor = ?",[req.body.fullName],(err2,result2) => {
                if(err2) throw err2;

               res.redirect(`/main/startups/${result2[0].id}`)
      })  
    })
    }catch(err){
            console.log(err);
        }
    })

    app.get("/main/startups/:id",(req,res)=>{
        let {id} = req.params;

        try{
            connection.query("Select * from investor where id = ?",id,(err,result) => {
                if(err) throw err;
                res.render("startup.ejs",{data : result})
            })
         }
          catch(err){
                console.log(err);
            }
    })

  

    app.post("/main/startupreg/:id",(req,res)=>{
        // let {id} = req.params;
        // console.log(req.file);

        // let {startup_name ,year,sec,web,exc,add} = req.body;

        // console.log(req.body)
        

        // const excelFilePath = req.file.path; // Get the path of the uploaded file
  // const csvFilePath = path.join('uploads/', `${path.parse(req.file.originalname).name}.csv`)

  

        try{
            connection.query("insert into startup(id,Name_of_startup,YearEst,startup_sector,startup_web,adddoc) values (?,?,?,?,?,?)",[id,req.body.startup_name,req.body.year,req.body.sec,req.body.web,req.body.add],(err,result) => {
                if(err) throw err;
            })
         }
          catch(err){
                console.log(err);
            }
    })
    
      // async function uploadToGemini(filePath, mimeType) {
      //   // Simulating a file upload
      //   return {
      //     mimeType: mimeType,
      //     uri: `gemini://files/${path.basename(filePath)}`,
      //   };
      // }
      
      // // Define waitForFilesActive to simulate processing delay
      // async function waitForFilesActive(files) {
      //   await new Promise((resolve) => setTimeout(resolve, 2000));
      // }
      
      // // Route to handle chatbot interaction
      // function readExcelFromBlob(blob) {
      //   const workbook = xlsx.read(blob, { type: 'buffer' });
      //   const sheetName = workbook.SheetNames[0]; // Get the first sheet
      //   const sheet = workbook.Sheets[sheetName]; // Get the sheet
      //   return xlsx.utils.sheet_to_json(sheet); // Convert to JSON
      // }
      
      // // Endpoint to fetch the Excel file and analyze data

      app.post("/upload/:id",upload.single("exc"),(req,res) => {
        const balanceSheetPath = req.file.path; // Get the path of the uploaded file
          let {id} = req.body.id;
      
     
        // Insert path to MySQL\
        try{
          connection.query("Select * from investor where id = ?",id,(err1,result1) => {
              if(err1) throw err1;

              connection.query(
                "UPDATE startups set balancesheet= ? where id = ?",
                [req.file.path,id],
                (err2, result2) => {

              connection.query(
                "INSERT INTO investorpath(Name, balance_sheet_path) VALUES (?, ?)",
                [result1[0].Name_of_investor, balanceSheetPath],
                (err3, result3) => {
          })
       }
      )}
      )}catch(err){
              console.log(err);
        }
      })

      app.get('/main/analyses', async (req, res) => {
        function readExcelFile(filePath) {
          const workbook = xlsx.readFile(filePath);
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          return xlsx.utils.sheet_to_json(worksheet);
        }
      
        async function run() {
          try {
            connection.query("SELECT * FROM investorpath", async (err1, result1) => {
              if (err1) {
                console.error("Database query error:", err1);
                return res.status(500).json({ error: "Database query error." });
              }
      
              let finalText = ""; // Initialize finalText before using it
      
              for (let i = 0; i < result1.length; i++) {
                const filePath = `C:\\Users\\omen playground\\Desktop\\mumbai hacks\\uploads\\${result1[i].balance_sheet_path}`;
                const jsonData = readExcelFile(filePath);
                const jsonText = JSON.stringify(jsonData, null, 2);
      
                // Concatenate the JSON text
                finalText += jsonText; 
              }
      
              // Start the chat session and provide the JSON content as context
              const chatSession = model.startChat({
                generationConfig,
                history: [
                  {
                    role: 'user',
                    parts: [
                      { text: `Here is some startup data in JSON format:\n\n${finalText}` },
                    ],
                  },
                ],
              });
      
              const result = await chatSession.sendMessage("Please analyze the data provided. You have 1 or 2 companies which will give you their numerical value. Please advise the investor which company he should invest in and why.");
              
              // Log the response
              console.log(result.response.text); // Access the text directly
      
              // Render the response using EJS
              res.render("analyses.ejs", { data: result.response.text }); 
            });
          } catch (err) {
            console.error("Error:", err);
            res.status(500).json({ error: "An unexpected error occurred." });
          }
        }
      
        run();
      });
      
     

    
      const PORT = process.env.PORT || 3000;
      app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
      });