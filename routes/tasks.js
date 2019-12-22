const express = require('express');
const router = express.Router();
const Board = require("../models/board");
const ensureAuthenticated = require('../middleware/ensureAuthenticated');
const canCompliteTasks = require('../middleware/canCompliteTasks');

// Task Model
let Task = require('../models/task');
// User Model
let User = require('../models/user');


// Add Submit POST Route
router.post('/add', ensureAuthenticated, canCompliteTasks, function (req, res) {

    Board.findById(req.body.boardId, async function (err, board) {
        if (err) {
            console.log(err);
            res.redirect("/");
        } else {
            let task = new Task({
                title: req.body.name,
                filled: false,
                author: {
                    id: req.user._id,
                    username: req.user.username
                }
            });
            
            await task.save();
            board.tasks.push(task);
            await board.save();
            let data = {
                taskId: task._id,
                taskText: task.title,
                taskFilled: task.filled,
                boardId: board._id,

            }
            res.status(200).send(JSON.stringify(data));
        }
    });
});

router.put('/complete', ensureAuthenticated, canCompliteTasks, function (req, res) {
    Task.findById(req.body.id, async function(err, task) {
        if(err) {
            console.log(err)
            res.redirect("/");
        } else {
            task.filled = true;
            await task.save();
            res.status(200).send();
        }
    })
})

// req.checkBody(req.body.name,'Title is required').notEmpty();
//req.checkBody('author','Author is required').notEmpty();
// req.checkBody('body','Body is required').notEmpty();

// Get Errors
// let errors = req.validationErrors();

// if(errors){
//     res.render('add_task', {
//         title:'Add Task',
//         errors:errors
//     });
// } else {
//     let task = new Task({
//         title: req.body.title,
//         author: {
//             id: req.user._id,
//             username: req.user.username
//         }
//     });




// Load Edit Form
// router.get('/edit/:id', ensureAuthenticated, function (req, res) {
//     Task.findById(req.params.id, function (err, task) {
//         if (task.author != req.user._id) {
//             req.flash('danger', 'Not Authorized');
//             return res.redirect('/');
//         }
//         res.render('edit_task', {
//             title: 'Edit Task',
//             task: task
//         });
//     });
// });

// Update Submit POST Route
// router.post('/edit/:id', function (req, res) {
//     let task = {};
//     task.title = req.body.title;
//     task.author = req.body.author;
//     task.body = req.body.body;

//     let query = {
//         _id: req.params.id
//     }

//     Task.update(query, task, function (err) {
//         if (err) {
//             console.log(err);
//             return;
//         } else {
//             req.flash('success', 'Task Updated');
//             res.redirect('/');
//         }
//     });
// });

// Delete Task
router.delete('/:id', ensureAuthenticated, canCompliteTasks, async function (req, res) {

    let query = {
        _id: req.body.id
    }

    Task.findById(req.params.id, function (err, task) {
        task.remove(query, function (err) {
            if (err) {
                console.log(err);
            } else {
                Board.findOneAndUpdate(req.body.boardId, {
                    $pull: {
                        tasks: req.body.id
                    }
                }, function (err, board) {
                    if (err) {
                        console.log(err);
                    } else {
                        board.save();
                        res.status(200).json({
                            message: 'Removed'
                        });
                    }

                });
            };
        });
    });

});

// // Get Single Task
// router.get('/:id', function (req, res) {
//     Task.findById(req.params.id, function (err, task) {
//         User.findById(task.author, function (err, user) {
//             res.render('task', {
//                 task: task,
//                 author: user.name
//             });
//         });
//     });
// });



module.exports = router;
