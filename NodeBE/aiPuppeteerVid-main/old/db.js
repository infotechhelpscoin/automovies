const Datastore = require('nedb');
const db = new Datastore({ filename: 'database.db', autoload: true });

async function dbinsert(doc)
{
  await db.insert(doc, (err, newDoc) => {
        if (err) {
          console.error(err);
        } else {  
          console.log('Inserted document:', newDoc);
        }
      });
      
}
async function dbfind(filter)
{
db.find(filter, (err, docs) => {
    if (err) {
      console.error(err);
    } else {
      console.log('Found documents:', docs);
    }
  });
}
module.exports={dbinsert:dbinsert}