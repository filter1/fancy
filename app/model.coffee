mysql = require 'mysql'
 
connection = mysql.createConnection(
    {
      host     : 'localhost',
      user     : 'admin',
      database : 'name'
    }
)
 
connection.connect( (err)-> 
  if err
    console.error('error connecting: ' + err.stack)
    return
  console.log('connected as id ' + connection.threadId)
)
 
# connection.beginTransaction((err)-> {
#   if (err) { throw err }
#   connection.query('INSERT INTO names SET name=?', "sameer", (err, result)-> {
#     if (err) { 
#       connection.rollback(-> {
#         throw err
#       })
#     }
 
#     log = result.insertId
 
#     connection.query('INSERT INTO log SET logid=?', log, (err, result)-> {
#       if (err) { 
#         connection.rollback(-> {
#           throw err
#         })
#       }  
#       connection.commit((err)-> {
#         if (err) { 
#           connection.rollback(-> {
#             throw err
#           })
#         }
#         console.log('Transaction Complete.')
#         connection.end()
#       })
#     })
#   })
# })
