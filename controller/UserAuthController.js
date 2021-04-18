const bcrypt = require('bcryptjs');
const User = require('../models/AuthUser');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const nodemailer = require("nodemailer");
const path = require('path');

//zomato
var dotenv = require("dotenv")
    const zomato = require("zomato");

    dotenv.config();                                                
    var Promise = require("promise")

    const client = zomato.createClient({userKey: process.env.ZOMATO_USER_API})

    var nodeGeo = require("node-geocoder")
    var options = {
        provider : 'opencage',                                     
        httpAdapter : 'https',
        apiKey : process.env.ZOMATO_API,              
        formatter : null
    }
    var geocoder = nodeGeo(options)


exports.register = function(req, res, next) {
	var userInfo = req.body;
	if(!userInfo.email || !userInfo.name || !userInfo.password || !userInfo.password2){
		req.flash('error_msg','All field are required..');
		res.redirect('/users/register');
	} else {
		if (userInfo.password == userInfo.password2) {
			User.findOne({email:userInfo.email},function(err,data){
				if(!data){
					var newUser = new User({
							email:userInfo.email,
							name: userInfo.name,
							password: userInfo.password,
							password2: userInfo.password2
						});
						bcrypt.genSalt(10, (err, salt) => {
						bcrypt.hash(newUser.password, salt, (err, hash) => {
						if (err) throw err;
						newUser.password = hash;
						newUser.save()
						async function main() {

						//welcomw email		
					    var transport = nodemailer.createTransport({
					        host: "smtp.mailtrap.io",
					        port: 2525,
					        auth: {
					          user: "cec9437db3a12a",
					          pass: "52f355240f9b45"
					        }
					    });
					
						let info = await transport.sendMail({
							from: 'test1@gmail.com', 
							to: 'test2@gmail.com, test3@gmail.com', 
							subject: "Welcome to our App", 
							html: `<p> HI ${newUser.name} </p>
									<p>Welcome to App , Let me Know how you get along with APP</p>`, 
						});
							console.log("Message sent: %s", info.messageId);
							
							console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
					}
					main().catch(console.error)
                    .then(user => {
                    req.flash(
                      'success_msg',
                      'You are now registered and can log in'
                    );
                    res.redirect('/users/login');
                    })
                    .catch(err => console.log(err));
                });
            });
			}else{
				req.flash('error_msg','Email is already used.');
				res.redirect('/users/register');
				}
			});
		}else{
			req.flash('error_msg','password is not matched');
			res.redirect('/users/register');
		}
	}  
};


//forget password
exports.forgetpassword = async (req,res,email) => {  
	const emaildata = req.body.email;
	if(!emaildata){
		req.flash('error_msg', 'Email is required');
		res.redirect('/resetPassword')
	}
	const user = await User.findOne({ email:req.body.email });
	if(!user){
		req.flash('error_msg', 'Enter a valid Email');
		res.redirect('/resetPassword')
	}
	try{
	if(user.email){
		const token =jwt.sign({id : user._id},'tokengeneration')
		const link = `http://localhost:3000/resetPassword/${token}`;
		user.resetToken = token,
		user.expireToken = Date.now() + 3600000
		user.save()
    	var transport = nodemailer.createTransport({
			host: "smtp.mailtrap.io",
			port: 2525,
			auth: {
				user: "cec9437db3a12a",
				pass: "52f355240f9b45"
			}
      	});
	  	let info = await transport.sendMail({
		    from: 'test1@gmail.com', 
		    to: 'test2@gmail.com, test3@gmail.com', 
		    subject: "forget Password", 
		    html: ` <p>Hi ${user.name},</p>
					<p>You requested to reset your password.</p>
					<p> Please, click the link below to reset your password</p>
					<a href="${link}">Reset Password</a>
					`, 
				 });
		req.flash('success_msg', 'Mail sent your Register Email-Id');
		res.redirect('/users/login')
		console.log("Message sent: %s", info.messageId);

		console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info)); 

	}else{
		req.flash('error_msg', 'Enter a valid Email');
		res.redirect('/resetPassword')
	}
	}catch(e){
		console.log(e);
	}
}
  
// request reset password
exports.requestResetPassword = async (req,res) => {  
	try{
	const newPassword = req.body.password;
	const newPassword2 = req.body.password2;
	var resetToken = req.params.token;
	const user = await User.findOne({ resetToken });
	if(!newPassword || !newPassword2){
		req.flash('error_msg','password is required');
	    res.redirect('/resetPassword/'+resetToken)
	}
	if(newPassword == newPassword2){
		if(user){
			bcrypt.hash(newPassword, 10, function(err, hash) {
				user.password = hash;
				user.resetToken = null;
				expireToken = null
				user.save()
			});	
		}	
		req.flash('success_msg', 'Password Reset Sucessfully');
		res.redirect('/users/login')
    }else{
		req.flash('error_msg','password is not matched');
		res.redirect('/resetPassword/'+resetToken)
        }
	}
	catch(e){
		console.log(e);
	}
}

// Login
exports.login =  (req, res, next) => {
	passport.authenticate('user-local', {
		successRedirect: '/dashboard',
		failureRedirect: '/users/login',
		failureFlash: true
	})(req, res, next);
};

// dashboard for zomato
exports.dashboard = function (req, res) {
	res.render('zomatodash.hbs', {
		test: req.body.city
	});
  };
  
  //search city api
exports.searchCity = (req, res)=>{
	let name = req.body.city
	client.getLocations({query: name,}, (err, result) =>{
		if(!err){
			let main_data = JSON.parse(result).location_suggestions;
			let latitude = JSON.stringify (main_data[0].latitude);
			let longitude = JSON.stringify (main_data[0].longitude);
			client.getGeocode({lat:latitude, lon:longitude},(err, result)=>{
				if(!err){
					let data = JSON.parse(result).nearby_restaurants; 
					let data_list = [];
					for(var j of data){
						var Dict={
							name: j.restaurant.name,
							address: j.restaurant.location.address,
							average_cost_for_two: j.restaurant.average_cost_for_two,
							price_range: j.restaurant.price_range,
							has_online_delivery: j.restaurant.has_online_delivery,
							cuisines: j.restaurant.cuisines,
							featured_image: j.restaurant.featured_image,
							url: j.restaurant.url,
							photos_url: j.restaurant.photos_url
						}
						data_list.push(Dict);
					}
					// console.log(data_list);
          res.render(path.resolve(__dirname, '../views/zomatoSearch.ejs') , { all_data: data_list})
				}else{
					console.log(err);
				}
			})
		}else{
			console.log(err);
		}
	})
};  


// Logout
exports.logout = (req, res) => {
    req.logout();
    req.flash('success_msg', 'You are logged out');
  	res.redirect('/users/login');
};
  
