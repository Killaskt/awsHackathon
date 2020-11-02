'use strict';
const AWS = require('aws-sdk');
const moment = require('moment');
const {v4: uuid} = require('uuid');

const jobs = [
  {
    "id": 1,
    "title": "Nodejs Dev",
  },
  {
    "id": 2,
    "title": "Angular Dev",
  }
]

console.log('IS_OFFLINE: ', process.env.IS_OFFLINE);

const options = {};

try {
  if (process.env.IS_OFFLINE) {
    options.region = 'localhost';
    options.endpoint = 'https://localhost:8000';
  } else {
    options.region = 'us-east-2';
  }
} catch (e) {
  console.log(e)
  
}

// creates new instance of DynamoDB
const dDB = new AWS.DynamoDB.DocumentClient(options);

const tablename = process.env.MEMBERS;

module.exports = {
  // evt - event, runs any event specified in command to run function
  // ex. sls invoke local -f hello -p event.json
  // ctx - contex,
  handler: async (evt, ctx) => {
    console.log(evt)
    console.log(ctx)

    return {
      statusCode: 200,
      body: JSON.stringify({
        "name": "nodejs developer",
        "message": "I am from the handler",
      })
    }
  },

  newMember: async (evt, ctx) => {
    // function adds new members to db
    
    const data = JSON.parse(evt.body);
    const email = data.email;
    const timestamp = new Date();
    const formattedTime = moment(timestamp).format();


    // secondary index query to check if email exists 
    let query_params = {
      TableName: tablename,
      IndexName: "EmailIndex",
      KeyConditionExpression: "#key = :em",
      ExpressionAttributeNames: {
        "#key": "Email",
      },
      ExpressionAttributeValues: {
        ":em": data.Email,
      },
    }


    const newMem = {
      TableName: process.env.MEMBERS,
      Item: {
        ID: uuid(),
        Email: data.Email,
        FirstName: data.FName ? data.FName : '',
        LastName: data.LName ? data.LName : '',
        Gender: data.Gender ? data.Gender : '',
        School: data.School ? data.School : '',
        // current level of study
        GradeLevel: data.Grade ? data.Grade : '',
        Major: data.Major ? data.Major : '',
        Skills: data.Skills ? data.Skills : '',
        // wants a random group chosen for them
        WantsRandom: data.Random ? data.Random : 0,
        // required, for only wayne state students
        AccessID: data.AccessID ? data.AccessID : '',
        // required, 18 and older
        Age: data.Age ? data.Age : '',
        CreatedAt: formattedTime
      }

    }

    let result = await dDB.query(query_params).promise();

    if (!result.Items[0]) {

      const newMem = {
        TableName: process.env.MEMBERS,
        Item: {
          ID: uuid(),
          Email: data.Email,
          FirstName: data.FName ? data.FName : '',
          LastName: data.LName ? data.LName : '',
          School: data.School ? data.School : '',
          GradeLevel: data.Grade ? data.Grade : '',
          Skills: data.Skills ? data.Skills : '',
          // wants a random group chosen for them
          WantsRandom: data.Random ? data.Random : 0,
          CreatedAt: formattedTime
        }
      }
      
      try {
        // console.log(data, data.Email)
        const res = await dDB.put(newMem).promise();
        console.log(res);
        
        // TODO: Add Twilio command, which sends a email to user w/ Discord Link!
        
        return {
          statusCode: 200,
          body: JSON.stringify(newMem.Item)
        }
        
      } catch (e) {
        console.log('DYNAMODB PUT ERROR: ', e);
        return {
          statusCode: 500,
          body: JSON.stringify({
            Error: "DynamoDB Save Error",
            Message: e
          })
        }
      }
    } else {
      return {
        statusCode: 403,
        body: JSON.stringify({
          Error: "Email Already Exists!",
          Message: e
        })
      };
    }

  }, 

  // list: async (evt, ctx) => {
  //   return {
  //     statusCode: 200,
  //     body: JSON.stringify({
  //       jobs
  //     })
  //   }
  // },
  // createJob: async (evt, ctx) => {
  //   // add new job to existing jobs
  //   console.log(evt.body);
  //   jobs.push(JSON.parse(evt.body)); 
  //   return {
  //     statusCode: 200,
  //     body: JSON.stringify({
  //       jobs
  //     })
  //   }
  // },
  // fetchJob: async (evt, ctx) => {
  //   // add new job to existing jobs
  //   const idx = jobs.findIndex(j => j.id == evt.pathParameters.id);

  //   jobs.push(JSON.parse(evt.body)); 
  //   return {
  //     statusCode: 200,
  //     body: JSON.stringify({
  //       job: jobs[idx]
  //     })
  //   }
  // },

  // Use this code if you don't use the http event with the LAMBDA-PROXY integration
  // return { message: 'Go Serverless v1.0! Your function executed successfully!', event };
};
