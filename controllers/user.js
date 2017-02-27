var User = require('../models/user');
var Functions = require('../util/functions');
var Patient = require('../models/patient');
var Doctor = require('../models/doctor');
var sha512 = require('sha512');
var fs = require('fs');
var nodemailer = require('nodemailer');
var Secretary = require('../models/secretary');

var token = require('token');
token.defaults.secret = 'medhelp';
token.defaults.timeStep = 30*60;// 30 minutos

var smtpTransport = require('nodemailer-smtp-transport');

var transporter = nodemailer.createTransport(smtpTransport({
    service: 'gmail',
    auth: {
        user: 'medhelp.noreply@gmail.com',
        pass: 'medhelp123'
    }
}));

function UserController () {
	this.functions = new Functions();
}

UserController.prototype.getAll = function(callback) {
	User.find(function (error, users) {
		if (error) {
			callback(null, error);
		} else {
			callback(users);
		}
	});
};

UserController.prototype.update = function (id, user, callback) {
	User.findOne({ _id: id }, function (error, u) {
		if (error) {
			callback(error);
		} else {
			u.name = user.name;
			u.email = user.email;
			if (user.userType)
				u.userType = user.userType;

			u.profileImage = user.profileImage;

			u.save(function (error) {
				if(error){
					callback(error);
				} else{
					callback(null);
				}
			})
		}
	});
}

UserController.prototype.getEmail = function(_email,callback) {
	User.find({ email: global.encrypt(_email) }, function (error, users) {
		if (error) {
			callback(null, error);
		} else {
			callback(users);
		}
	});
};

UserController.prototype.getForId = function (idUser, callback) {
	User.findOne({_id: idUser},function (error, user) {
		if(error){
			callback(null, error);
		}else{
			callback(user);
		}
	})
};

UserController.prototype.findName = function(name, callback) {
	User.find({name: new RegExp(global.encrypt(name), "i"), userType: "1" }, function (error, doctors) {
		if (error) {
			callback(null, error);
		} else {
			callback(doctors);
		}
	});
};

UserController.prototype.findDoctors = function(callback) {
	User.find({ userType: "1" }).distinct('name', function (error, doctors) {
		if (error) {
			callback(null, error);
		} else {
			callback(doctors);
		}
	});
};

UserController.prototype.insert = function(_user, callback) {
	var functions = this.functions;
	var userType = _user.userType;

	User.find({ email: global.encrypt(_user.email) }, function (error, users) {
		if (error) {
			callback(null, error);
		} else {
			if (functions.validateEmail(_user.email)) {
				if (_user.password == _user.rePassword && _user.password.length >= 6) {
						if (users.length === 0) {
							if(_user.userType == 0 || _user.userType == 1){

								if (_user.name) {
									var user = new User();
									user.userType = _user.userType;
									user.name = _user.name;
									user.email = _user.email;
									user.password = sha512(_user.password).toString('hex');
									user.save(function (error, _user) {
										if (error) {
											callback(null, error);
										} else {
											if (userType == 0) {
												var patient = new Patient();
												patient._id = _user._id;
												patient.addressStreet = "";
												patient.addressNumber = "";
												patient.city = "";
												patient.state = "";
												patient.zipCode = "";
												patient.country = "";
												patient.phone = "";
												patient.profileImage = "";
												patient.bodyPart = [{part : 'rightArm', subpart: 'hand', problems: []},{part : 'rightArm', subpart: 'forearm', problems: []},{part : 'rightArm', subpart: 'elbow', problems: []},{part : 'rightArm', subpart: 'arm', problems: []},
																	{part : 'leftArm', subpart: 'hand' ,problems: []},{part : 'leftArm', subpart: 'forearm' ,problems: []},{part : 'leftArm', subpart:'elbow' ,problems: []},{part : 'leftArm', subpart: 'arm' ,problems: []},
																	{part : 'rightLeg', subpart: 'foot' ,problems: []},{part : 'rightLeg', subpart: 'leg' ,problems: []},{part : 'rightLeg', subpart: 'thigh' ,problems: []},{part : 'rightLeg', subpart: 'knee' ,problems: []},
																	{part : 'leftLeg', subpart:'foot', problems: []},{part : 'leftLeg', subpart:'leg', problems: []},{part : 'leftLeg', subpart:'thigh', problems: []},{part : 'leftLeg', subpart:'knee', problems: []},
																	{part : 'trunk', subpart:'thorax',problems: []},{part : 'trunk', subpart:'loin',problems: []},{part : 'trunk', subpart:'abdomen',problems: []},
																	{part : 'head', subpart:'face',problems: []},{part : 'head', subpart:'head',problems: []}];
												
												patient.save(function (error, patient) {
													if (error) {
														callback(null, error);
													} else {
														callback(_user);
													}
												});
											} else{
												var doctor = new Doctor();
												doctor._id = _user._id;
												doctor.addressStreet = "";
												doctor.addressNumber = "";
												doctor.city = "";
												doctor.state = "";
												doctor.zipCode = "";
												doctor.country = "";
												doctor.phone = "";
												doctor.crm = "";
												doctor.profileImage = "";

												doctor.save(function (error, doctor) {
													if (error) {
														callback(null, error);
													} else {
														callback(_user);
													}
												});
											}
										}
									});
								} else {
									callback(null, { error: 'O campo \'name\' é obrigatório.' });
								}
							} else {
								callback(null, { error: 'Tipo de usuário inválido.' });
							}
						} else {
							callback(null, { error: 'E-mail duplicado.' });
						}
				} else {
					callback(null, { error: 'Senhas inválidas.' })	
				}
			} else {
				callback(null, { error: 'E-mail inválido.' })
			}
		}
	});
};

UserController.prototype.login = function(login, callback) {
	if (login && login.email && login.password) {
		var passwordHash = sha512(login.password).toString('hex');
		User.find({ email: global.encrypt(login.email), password: global.encrypt(passwordHash) }, function (error, users) {
			if (error) {
				callback(null, error);
			} else {
				if (users.length > 0) {
					users[0].profileImage = '';
					callback(users[0]);
				} else {
					callback(null, { error: 'E-mail ou senha inválidos.' });
				}
			}
		});
	} else {
		callback(null, { error: 'E-mail ou senha inválidos.' });
	}
};

UserController.prototype.delete = function(id, callback) {
	User.remove({ _id: id }, function (error) {
		if (error) {
			callback(null, { error: 'ID inválido.' });
		} else {
			callback({ message: 'Removido com sucesso.' });
		}
	});
};

UserController.prototype.updatePassword = function (_id, body, callback) {
	User.findById(_id,function (err, user) {
		if(err){
			callback({error: 'Error ao buscar usuário!'})
		}else{
			if(user){
				var oldPassword = sha512(body.oldPassword).toString('hex');
				if(user.password ===oldPassword){
					if(body.newPassword.length>6 && body.newPassword===body.reNewPassword){
						var newPassword = sha512(body.newPassword).toString('hex')
						user.password = newPassword;
						user.save(function (err) {
							if(err){
								callback({error: 'Não foi possível alterar a senha!'})
							}else{
								callback({success: 'true'});
							}
						})
					}else{
						callback({error: 'Nova senha inválida!'})
					}

				}else{
					callback({error: 'Senha antiga incorreta!'})
				}
			}else{
				callback({error: 'Usuário não existe!'})
			}
		}
	})
}

UserController.prototype.forgottenPassword_sendToken = function (email, callback) {
	User.find({email: global.encrypt(email)},function (err, users) {
		if (err) {
			callback({error: 'Error ao buscar usuário!'})
		} else {
			if (users.length===1) {
				var tokenGenerated = token.generate(email);
				var mailOptions = {
					from: '"MedHelp Time" <medhelp.noreply@gmail.com>',
					to: email,
					subject: 'Recuperar senha do Medhelp',
					text: 'Recuperar senha do Medhelp',
					html: '<html xmlns="http://www.w3.org/1999/xhtml" xmlns="http://www.w3.org/1999/xhtml"><head> <meta http-equiv="Content-Type" content="text/html; charset=utf-8" /> <meta name="viewport" content="width=device-width" /> <!-- For development, pass document through inliner --> </head><body style="margin: 0;padding: 0;font-size: 100%;font-family: &quot;Avenir Next&quot;, &quot;Helvetica Neue&quot;, &quot;Helvetica&quot;, Helvetica, Arial, sans-serif;line-height: 1.65;width: 100% !important;height: 100%;background: #efefef;-webkit-font-smoothing: antialiased;-webkit-text-size-adjust: none"><table class="body-wrap" style="margin: 0;padding: 0;font-size: 100%;font-family: &quot;Avenir Next&quot;, &quot;Helvetica Neue&quot;, &quot;Helvetica&quot;, Helvetica, Arial, sans-serif;line-height: 1.65;width: 100% !important;height: 100%;background: #efefef;-webkit-font-smoothing: antialiased;-webkit-text-size-adjust: none"> <tr style="margin: 0;padding: 0;font-size: 100%;font-family: &quot;Avenir Next&quot;, &quot;Helvetica Neue&quot;, &quot;Helvetica&quot;, Helvetica, Arial, sans-serif;line-height: 1.65"> <td class="container" style="margin: 0 auto !important;padding: 0;font-size: 100%;font-family: &quot;Avenir Next&quot;, &quot;Helvetica Neue&quot;, &quot;Helvetica&quot;, Helvetica, Arial, sans-serif;line-height: 1.65;display: block !important;clear: both !important;max-width: 580px !important"> <!-- Message start --> <table style="margin: 0;padding: 0;font-size: 100%;font-family: &quot;Avenir Next&quot;, &quot;Helvetica Neue&quot;, &quot;Helvetica&quot;, Helvetica, Arial, sans-serif;line-height: 1.65;width: 100% !important;border-collapse: collapse"> <tr style="margin: 0;padding: 0;font-size: 100%;font-family: &quot;Avenir Next&quot;, &quot;Helvetica Neue&quot;, &quot;Helvetica&quot;, Helvetica, Arial, sans-serif;line-height: 1.65"> <td align="center" class="masthead" style="margin: 0;padding: 80px 0;font-size: 100%;font-family: &quot;Avenir Next&quot;, &quot;Helvetica Neue&quot;, &quot;Helvetica&quot;, Helvetica, Arial, sans-serif;line-height: 1.65;background: #336699;color: white"> <h1 style="margin: 0 auto !important;padding: 0;font-size: 32px;font-family: &quot;Avenir Next&quot;, &quot;Helvetica Neue&quot;, &quot;Helvetica&quot;, Helvetica, Arial, sans-serif;line-height: 1.25;margin-bottom: 20px;max-width: 90%;text-transform: uppercase">Recupere sua senha</h1> </td> </tr> <tr style="margin: 0;padding: 0;font-size: 100%;font-family: &quot;Avenir Next&quot;, &quot;Helvetica Neue&quot;, &quot;Helvetica&quot;, Helvetica, Arial, sans-serif;line-height: 1.65"> <td class="content" style="margin: 0;padding: 30px 35px;font-size: 100%;font-family: &quot;Avenir Next&quot;, &quot;Helvetica Neue&quot;, &quot;Helvetica&quot;, Helvetica, Arial, sans-serif;line-height: 1.65;background: white"> <h2 style="margin: 0;padding: 0;font-size: 28px;font-family: &quot;Avenir Next&quot;, &quot;Helvetica Neue&quot;, &quot;Helvetica&quot;, Helvetica, Arial, sans-serif;line-height: 1.25;margin-bottom: 20px">Olá '+users[0].name+'</h2> <p style="margin: 0;padding: 0;font-size: 16px;font-family: &quot;Avenir Next&quot;, &quot;Helvetica Neue&quot;, &quot;Helvetica&quot;, Helvetica, Arial, sans-serif;line-height: 1.65;font-weight: normal;margin-bottom: 20px">Foi feito um pedido de recuperação de senha na sua conta do Medhelp.</p> <table style="margin: 0;padding: 0;font-size: 100%;font-family: &quot;Avenir Next&quot;, &quot;Helvetica Neue&quot;, &quot;Helvetica&quot;, Helvetica, Arial, sans-serif;line-height: 1.65;width: 100% !important;border-collapse: collapse"> <tr style="margin: 0;padding: 0;font-size: 100%;font-family: &quot;Avenir Next&quot;, &quot;Helvetica Neue&quot;, &quot;Helvetica&quot;, Helvetica, Arial, sans-serif;line-height: 1.65"> <td align="center" style="margin: 0;padding: 0;font-size: 100%;font-family: &quot;Avenir Next&quot;, &quot;Helvetica Neue&quot;, &quot;Helvetica&quot;, Helvetica, Arial, sans-serif;line-height: 1.65"> <p style="margin: 0;padding: 0;font-size: 16px;font-family: &quot;Avenir Next&quot;, &quot;Helvetica Neue&quot;, &quot;Helvetica&quot;, Helvetica, Arial, sans-serif;line-height: 1.65;font-weight: normal;margin-bottom: 20px"> <a href="http://medhelp-app.github.io/senha.html?id='+users[0]._id+'&tokenGenerated='+tokenGenerated+'" class="button" style="margin: 0;padding: 0;font-size: 100%;font-family: &quot;Avenir Next&quot;, &quot;Helvetica Neue&quot;, &quot;Helvetica&quot;, Helvetica, Arial, sans-serif;line-height: 1.65;color: white;text-decoration: none;display: inline-block;background: #336699;border: solid #336699;border-width: 10px 20px 8px;font-weight: bold;border-radius: 4px">Recupere sua senha</a> </p> </td> </tr> </table> </td> </tr> </table> </td> </tr> <tr style="margin: 0;padding: 0;font-size: 100%;font-family: &quot;Avenir Next&quot;, &quot;Helvetica Neue&quot;, &quot;Helvetica&quot;, Helvetica, Arial, sans-serif;line-height: 1.65"> <td class="container" style="margin: 0 auto !important;padding: 0;font-size: 100%;font-family: &quot;Avenir Next&quot;, &quot;Helvetica Neue&quot;, &quot;Helvetica&quot;, Helvetica, Arial, sans-serif;line-height: 1.65;display: block !important;clear: both !important;max-width: 580px !important"> <!-- Message start --> <table style="margin: 0;padding: 0;font-size: 100%;font-family: &quot;Avenir Next&quot;, &quot;Helvetica Neue&quot;, &quot;Helvetica&quot;, Helvetica, Arial, sans-serif;line-height: 1.65;width: 100% !important;border-collapse: collapse"> <tr style="margin: 0;padding: 0;font-size: 100%;font-family: &quot;Avenir Next&quot;, &quot;Helvetica Neue&quot;, &quot;Helvetica&quot;, Helvetica, Arial, sans-serif;line-height: 1.65"> <td class="content footer" align="center" style="margin: 0;padding: 30px 35px;font-size: 100%;font-family: &quot;Avenir Next&quot;, &quot;Helvetica Neue&quot;, &quot;Helvetica&quot;, Helvetica, Arial, sans-serif;line-height: 1.65;background: none"> <p style="margin: 0;padding: 0;font-size: 14px;font-family: &quot;Avenir Next&quot;, &quot;Helvetica Neue&quot;, &quot;Helvetica&quot;, Helvetica, Arial, sans-serif;line-height: 1.65;font-weight: normal;margin-bottom: 0;color: #888;text-align: center">Enviado por <a href="http://medhelp-app.github.io/" style="margin: 0;padding: 0;font-size: 100%;font-family: &quot;Avenir Next&quot;, &quot;Helvetica Neue&quot;, &quot;Helvetica&quot;, Helvetica, Arial, sans-serif;line-height: 1.65;color: #888;text-decoration: none;font-weight: bold">MedHelp</a></p> </td> </tr> </table> </td> </tr></table></body></html>'
				};
				transporter.sendMail(mailOptions, function(error, info){
					if(error){
						callback(null,error);
					}
					else{
						callback({success: 'true'});
					}
				});
			}else{
				callback({error: 'Usuário não existe!'})
			}

		}
	});
}
//body:{tokenGenerated:'', newPassword:'', reNewPassword:''}
UserController.prototype.forgottenPassword = function (_id, body, callback) {
	User.findById(_id,function (err, user) {
		if (err) {
			callback({error: 'Error ao buscar usuário!'})
		} else {
			if (user) {
				if(token.verify(user.email, body.tokenGenerated)==1){
					if(body.newPassword.length>6 && body.newPassword===body.reNewPassword){
						var newPassword = sha512(body.newPassword).toString('hex')
						user.password = newPassword;
						user.save(function (err) {
							if(err){
								callback({error: 'Não foi possível alterar a senha!'})
							}else{
								callback({success: 'true'});
							}
						})
					}else{
						callback({error: 'Nova senha inválida!'})
					}
				}else {
					callback({error: 'Tempo de recuperação de senha expirado!'})
				}
			} else {
				callback({error: 'Usuário não existe!'})
			}
		}
	});
}

UserController.prototype.updateImage = function (id, _image, callback) {
    fs.readFile('./uploads/'+_image.filename, function (error, data) {
        data = new Buffer(data).toString('base64');
        if(error){
            callback(null,error);
        }
        else{
            User.update({ _id: id }, { $set: {profileImage:data} }, { upsert: true }, function (error, status) {
                if (error) {
                    fs.unlink('./uploads/'+_image.filename);
                    callback(error);
                } else {
                    fs.unlink('./uploads/'+_image.filename);
                    callback({ sucess: "ok" });
                }
            });
        }     
    });             
};
/*---------Secretary-----------*/
UserController.prototype.listSecretary = function(callback) {
	console.log('entrou')
	User.find({userType: '2'},function (error, users) {
		if (error) {
			callback(null, error);
		} else {
			callback(users);
		}
	});
};
UserController.prototype.findNameSecretary = function(name, callback) {
	User.find({name: new RegExp(global.encrypt(name), "i"), userType: "2" }, function (error, users) {
		if (error) {
			callback(null, error);
		} else {
			callback(users);
		}
	});
};
UserController.prototype.getIdSecretary = function (idUser, callback) {
	User.findById(idUser,function (error, user) {
		if(error){
			callback(null, error);
		}else{
			if(user){
				Secretary.findById(idUser,function (error, secretary) {
					if(error){
						callback({Error: 'Error ao buscar!'})
					}else{
						callback({user:user,secretary:secretary });

					}
				})
			}

		}
	})
};

UserController.prototype.getByDoctor = function (id, callback) {
	Secretary.findOne({ doctorId: id },function (error, secretary) {
		if(error){
			callback({Error: 'Error ao buscar!'})
		} else {
			if (secretary) {
				User.findById(secretary._id, function (error, user) {
					if(error){
						callback(null, error);
					}else{
						callback({user:user,secretary:secretary });
					}
				})
			} else {
				callback(null);
			}
		}
	})
};

UserController.prototype.insertSecretary = function(_user, callback) {
	var functions = this.functions;

	User.findById(_user.doctorId, function (error, doctor) {
		if(error){
			callback({Error: 'Error insperado!'})
		}else {
			if(doctor){
				User.find({ email: global.encrypt(_user.email) }, function (error, users) {
					if (error) {
						callback(null, error);
					} else {
						if (functions.validateEmail(_user.email)) {
							if (_user.password == _user.rePassword && _user.password.length >= 6) {
								if (users.length === 0) {
									if (_user.name) {
										var user = new User();
										user.userType = '2';
										user.name = _user.name;
										user.email = _user.email;
										user.password = sha512(_user.password).toString('hex');
										user.save(function (error, _user) {
											var mailOptions = {
												from: '"MedHelp Time" <medhelp.noreply@gmail.com>',
												to: _user.email,
												subject: 'Bem Vindo ao Medhelp',
												text: 'Bem Vindo ao Medhelp',
												html: '<html xmlns="http://www.w3.org/1999/xhtml" xmlns="http://www.w3.org/1999/xhtml"><head> <meta http-equiv="Content-Type" content="text/html; charset=utf-8" /> <meta name="viewport" content="width=device-width" /> <!-- For development, pass document through inliner --> </head><body style="margin: 0;padding: 0;font-size: 100%;font-family: &quot;Avenir Next&quot;, &quot;Helvetica Neue&quot;, &quot;Helvetica&quot;, Helvetica, Arial, sans-serif;line-height: 1.65;width: 100% !important;height: 100%;background: #efefef;-webkit-font-smoothing: antialiased;-webkit-text-size-adjust: none"><table class="body-wrap" style="margin: 0;padding: 0;font-size: 100%;font-family: &quot;Avenir Next&quot;, &quot;Helvetica Neue&quot;, &quot;Helvetica&quot;, Helvetica, Arial, sans-serif;line-height: 1.65;width: 100% !important;height: 100%;background: #efefef;-webkit-font-smoothing: antialiased;-webkit-text-size-adjust: none"> <tr style="margin: 0;padding: 0;font-size: 100%;font-family: &quot;Avenir Next&quot;, &quot;Helvetica Neue&quot;, &quot;Helvetica&quot;, Helvetica, Arial, sans-serif;line-height: 1.65"> <td class="container" style="margin: 0 auto !important;padding: 0;font-size: 100%;font-family: &quot;Avenir Next&quot;, &quot;Helvetica Neue&quot;, &quot;Helvetica&quot;, Helvetica, Arial, sans-serif;line-height: 1.65;display: block !important;clear: both !important;max-width: 580px !important"> <!-- Message start --> <table style="margin: 0;padding: 0;font-size: 100%;font-family: &quot;Avenir Next&quot;, &quot;Helvetica Neue&quot;, &quot;Helvetica&quot;, Helvetica, Arial, sans-serif;line-height: 1.65;width: 100% !important;border-collapse: collapse"> <tr style="margin: 0;padding: 0;font-size: 100%;font-family: &quot;Avenir Next&quot;, &quot;Helvetica Neue&quot;, &quot;Helvetica&quot;, Helvetica, Arial, sans-serif;line-height: 1.65"> <td align="center" class="masthead" style="margin: 0;padding: 80px 0;font-size: 100%;font-family: &quot;Avenir Next&quot;, &quot;Helvetica Neue&quot;, &quot;Helvetica&quot;, Helvetica, Arial, sans-serif;line-height: 1.65;background: #336699;color: white"> <h1 style="margin: 0 auto !important;padding: 0;font-size: 32px;font-family: &quot;Avenir Next&quot;, &quot;Helvetica Neue&quot;, &quot;Helvetica&quot;, Helvetica, Arial, sans-serif;line-height: 1.25;margin-bottom: 20px;max-width: 90%;text-transform: uppercase">Bem vindo ao Medhelp</h1> </td> </tr> <tr style="margin: 0;padding: 0;font-size: 100%;font-family: &quot;Avenir Next&quot;, &quot;Helvetica Neue&quot;, &quot;Helvetica&quot;, Helvetica, Arial, sans-serif;line-height: 1.65"> <td class="content" style="margin: 0;padding: 30px 35px;font-size: 100%;font-family: &quot;Avenir Next&quot;, &quot;Helvetica Neue&quot;, &quot;Helvetica&quot;, Helvetica, Arial, sans-serif;line-height: 1.65;background: white"> <h2 style="margin: 0;padding: 0;font-size: 28px;font-family: &quot;Avenir Next&quot;, &quot;Helvetica Neue&quot;, &quot;Helvetica&quot;, Helvetica, Arial, sans-serif;line-height: 1.25;margin-bottom: 20px">Olá, você agora faz parte do MedHelp</h2> <p style="margin: 0;padding: 0;font-size: 16px;font-family: &quot;Avenir Next&quot;, &quot;Helvetica Neue&quot;, &quot;Helvetica&quot;, Helvetica, Arial, sans-serif;line-height: 1.65;font-weight: normal;margin-bottom: 20px">MedHelp é uma solução para facilitar na comunicação entre os pacientes e médicos.</p> <table style="margin: 0;padding: 0;font-size: 100%;font-family: &quot;Avenir Next&quot;, &quot;Helvetica Neue&quot;, &quot;Helvetica&quot;, Helvetica, Arial, sans-serif;line-height: 1.65;width: 100% !important;border-collapse: collapse"> <tr style="margin: 0;padding: 0;font-size: 100%;font-family: &quot;Avenir Next&quot;, &quot;Helvetica Neue&quot;, &quot;Helvetica&quot;, Helvetica, Arial, sans-serif;line-height: 1.65"> <td align="center" style="margin: 0;padding: 0;font-size: 100%;font-family: &quot;Avenir Next&quot;, &quot;Helvetica Neue&quot;, &quot;Helvetica&quot;, Helvetica, Arial, sans-serif;line-height: 1.65"> <p style="margin: 0;padding: 0;font-size: 16px;font-family: &quot;Avenir Next&quot;, &quot;Helvetica Neue&quot;, &quot;Helvetica&quot;, Helvetica, Arial, sans-serif;line-height: 1.65;font-weight: normal;margin-bottom: 20px"> <a href="http://medhelp-app.github.io/" class="button" style="margin: 0;padding: 0;font-size: 100%;font-family: &quot;Avenir Next&quot;, &quot;Helvetica Neue&quot;, &quot;Helvetica&quot;, Helvetica, Arial, sans-serif;line-height: 1.65;color: white;text-decoration: none;display: inline-block;background: #336699;border: solid #336699;border-width: 10px 20px 8px;font-weight: bold;border-radius: 4px">Acesse sua conta</a> </p> </td> </tr> </table> </td> </tr> </table> </td> </tr> <tr style="margin: 0;padding: 0;font-size: 100%;font-family: &quot;Avenir Next&quot;, &quot;Helvetica Neue&quot;, &quot;Helvetica&quot;, Helvetica, Arial, sans-serif;line-height: 1.65"> <td class="container" style="margin: 0 auto !important;padding: 0;font-size: 100%;font-family: &quot;Avenir Next&quot;, &quot;Helvetica Neue&quot;, &quot;Helvetica&quot;, Helvetica, Arial, sans-serif;line-height: 1.65;display: block !important;clear: both !important;max-width: 580px !important"> <!-- Message start --> <table style="margin: 0;padding: 0;font-size: 100%;font-family: &quot;Avenir Next&quot;, &quot;Helvetica Neue&quot;, &quot;Helvetica&quot;, Helvetica, Arial, sans-serif;line-height: 1.65;width: 100% !important;border-collapse: collapse"> <tr style="margin: 0;padding: 0;font-size: 100%;font-family: &quot;Avenir Next&quot;, &quot;Helvetica Neue&quot;, &quot;Helvetica&quot;, Helvetica, Arial, sans-serif;line-height: 1.65"> <td class="content footer" align="center" style="margin: 0;padding: 30px 35px;font-size: 100%;font-family: &quot;Avenir Next&quot;, &quot;Helvetica Neue&quot;, &quot;Helvetica&quot;, Helvetica, Arial, sans-serif;line-height: 1.65;background: none"> <p style="margin: 0;padding: 0;font-size: 14px;font-family: &quot;Avenir Next&quot;, &quot;Helvetica Neue&quot;, &quot;Helvetica&quot;, Helvetica, Arial, sans-serif;line-height: 1.65;font-weight: normal;margin-bottom: 0;color: #888;text-align: center">Enviado por <a href="http://medhelp-app.github.io/" style="margin: 0;padding: 0;font-size: 100%;font-family: &quot;Avenir Next&quot;, &quot;Helvetica Neue&quot;, &quot;Helvetica&quot;, Helvetica, Arial, sans-serif;line-height: 1.65;color: #888;text-decoration: none;font-weight: bold">MedHelp</a></p> </td> </tr> </table> </td> </tr></table></body></html>'
											};
											if (error) {
												callback(null, error);
											} else {
												var secretary = new Secretary();
												secretary.doctorId = doctor._id;
												secretary._id = _user._id;
												secretary.save(function (error, resul) {
													if (error) {
														callback(null, error);
													} else {
														transporter.sendMail(mailOptions, function(error, info){
															if(error){
																callback(null,error);
															}
															else{
																callback(_user);
															}
														});
													}
												});

											}
										});
									} else {
										callback(null, { error: 'O campo \'name\' é obrigatório.' });
									}

								} else {
									callback(null, { error: 'E-mail duplicado.' });
								}
							} else {
								callback(null, { error: 'Senhas inválidas.' })
							}
						} else {
							callback(null, { error: 'E-mail inválido.' })
						}
					}
				});
			}else{
				callback({Error: 'Doctor não existe!'})
			}
		}
	})

};
UserController.prototype.deleteSecretary = function(id, callback) {
	User.remove({ _id: id }, function (error) {
		if (error) {
			callback(null, { error: 'ID inválido.' });
		} else {
			Secretary.remove({ _id: id }, function (error) {
				if (error) {
					callback(null, {error: 'ID inválido.'});
				}else{
					callback({ message: 'Removido com sucesso.' });
				}
			})

		}
	});
};
/*---End Secretary---*/
module.exports = UserController;