const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const path = require("path");
const { error } = require("console");


const app = express();

//MONGODB CONNECTION..

const MONGO_URL = "mongodb://127.0.0.1:27017/college";
mongoose.connect(MONGO_URL)
.then(() =>{
    console.log("MongoDB connected");
})
.catch((error) =>{
    console.log("MongoDB connection error")
});


// teacher login page

app.get("/", (req, res) =>{
    res.sendFile(
        path.join(__dirname, "public","teacher-login.html")
    );
});

// MIDDLEWARE


app.use(express.static("public"));
app.use(express.json());


// SESSION MIDDLEWARE

app.use(session({

    secret: "college-attendance-secret",

    resave: false,

    saveUninitialized: false

}));

// CHECK TEACHER LOGIN 

function checkTeacherLogin(req, res, next){
    if(req.session.teacherId){
        next();
    }else{
        res.redirect("/")
    } 
}

// PROTECT DASHBOARD

app.get("/index.html", checkTeacherLogin, (req,res) =>{

    res.sendFile(
        path.join(__dirname, "public", "index.html")
    );
});

//STUDENT SCHEMA

const studentSchema = new mongoose.Schema({
    name: String,
    rollNumber: Number,
    branch: String,
    semester: Number,
    studentMobile: String,
    parentMobile: String,
    attendance: String,
    attendanceDate:Date,
    attendanceHistory:[{
        status: String,
        date: Date,
        subject: String,
        lectureNumber:Number,
        teacher: String
    }]
});



const student = mongoose.model("Student", studentSchema);

// TEACHER SCHEMA

const teacherSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String
});

// teacher model

const teacher = mongoose.model("Teacher", teacherSchema);

// CREATE TEACHER

app.post("/teachers", async (req,res) =>{
    try{
        let newTeacher = new teacher({
            name: req.body.name,
            email: req.body.email,
            password: req.body.password
        });

        await newTearcher.save();

        res.json({
            message:"Teacher created successfully",
            teacher: newTearcher
        });
    }catch(error){
        console.log("Teacher error:", error);

        res.status(500).json({
            message: "Teacher creation failed"
        });
    }
});
// TEACHER LOGIN
app.post("/teacher-login", async(req, res) =>{

    try{
        let email = req.body.email;
        let password = req.body.password;

        let teacherData = await teacher.findOne({
            email: email,
            password: password
        });

        if(!teacherData){
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        req.session.teacherId = teacherData._id;
        req.session.teacherName = teacherData.name;

        res.json({
            message:"Login successful",
            teacher: teacherData
        });
    }catch (error){
       console.log("Teacher login error:", error);

       res.status(500).json({
        message:"Login failed"
       });
    }
});

// CHECK  TEACHER SESSION..

app.get("/check-session", (req, res) =>{
    if(req.session.teacherId){

        res.json({
           
                loggedIn: true,
                teacherName: req.session.teacherName
            });
       
    }else{
        res.status(401).json({
            loggedIn: false,
            message: "Please login first"
        });
    }
});

// TEACHER LOGOUT 

app.get("/teacher-logout", (req, res) =>{

    req.session.destroy((error) =>{

        if(error){
            console.log("Logout error:",error);
            return res.status(500).send("Logout failed");
        }

        res.redirect("/");
    });
});

//MIDDLEWARE..

app.use(express.static("public"));
app.use(express.json());


//ADD STUDENT..

app.post("/students", async(req, res) => {
    try{

       console.log("request body:", req.body);
        let newStudent = new student(req.body);

        await newStudent.save();

        console.log("Student saved:", newStudent);
        res.json({
            message: "Student saved successfully"
        });
    }catch (error){
        console.log("Error:", error);

        res.status(500).json({
            message: "Student save failed"
        });
    }
});

//GET STUDENT..

app.get("/students", async(req, res) => {
    try{
        let students = await student.find();
        res.json(students);


    }catch (error) {
        console.log("Error:", error);

        res.status(500).json({
            message: "Student fetch failed"
        });
    }
});

// UPDATE STUDENT

app.put("/students/:id", async (req, res) =>{
    try{
        let studentId = req.params.id;

        let UpdateStudent = await student.findByIdAndUpdate(

            studentId,{
                name: req.body.name,
                rollNumber: req.body.rollNumber,
                branch: req.body.branch,
                semester: req.body.semester,
                studentMobile:

                req.body.studentMobile, parentMobile: req.body.parentMobile
            },
            {new: true}
        );

        if(!UpdateStudent){
            return res.status(404).json({
                message: "Student not found"
            });
        }

        res.json({
            message:"Student update successfully",
            student: UpdateStudent
        });
    }catch(error){
        console.log("update student error:", error);

        res.status(505).json({
            message: "Student update failed"
        });
    }
});

// DELETE STUDENT

app.delete("/students/:id", async (req, res) =>{
    try{
        let studentId = req.params.id;
        let deletedStudent = await student.findByIdAndDelete(studentId);

        if(!deletedStudent){
            return res.status(404).json({
                message: "Student not found"
            });

        }

        res.json({
            message: "Student deleted successfully"
        });

    }catch(error){
        console.log("Delete student error:", error);

        res.status(500).json({
            message:"Student delete failed"
        });
    }
});


//UPDATE ATTENDANCE

//Update Daily Attendance

app.put("/attendance", async(req, res)=>{

    try{
        let rollNumber = req.body.rollNumber;
        let attendance = req.body.attendance;
        let subject = req.body.subject;
        let lectureNumber = Number(req.body.lectureNumber);

        let teacher = req.session.teacherName

        let studentData = await student.findOne({rollNumber: rollNumber});

        if(!studentData){
            return res.status(404).json({
                message: "Student not found"
            });

        }

        let today = new Date();
        let existingIndex = studentData.attendanceHistory.findIndex(function(history){

            let historyDate = new Date(history.date);
            return(
                historyDate.getFullYear() === today.getFullYear()&&
                historyDate.getMonth() === today.getMonth()&&
                historyDate.getDate() === today.getDate()&&
                history.subject === subject &&
                history.lectureNumber === lectureNumber
            );
        });

        if(existingIndex !== -1){

            studentData.attendanceHistory[existingIndex].status = attendance;
            studentData.attendanceHistory[existingIndex].date = today;
            studentData.attendanceHistory[existingIndex].subject = subject;
            studentData.attendanceHistory[existingIndex].lectureNumber = lectureNumber;
            studentData.attendanceHistory[existingIndex].teacher = teacher;


        }else{
            studentData.attendanceHistory.push({
                status:attendance,
                date: today,
                subject: subject,
                lectureNumber: lectureNumber,
                teacher: teacher
            });
        }

        studentData.attendance = attendance;
        studentData.attendanceDate = today;
        await studentData.save();


        
    res.json({
        message:"Attendance saved successfully",
        student:studentData
    });

}catch (error){
    console.log("attendance arror:", error);

    res.status(500).json({
        message:"Attendance save failed"
    });
}

});

         

app.listen(8080, () => {
    console.log("server started on port 8080");
});