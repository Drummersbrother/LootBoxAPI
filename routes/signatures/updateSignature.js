const fs = require('fs');
const request = require('request');
const gm = require('gm');
const promise = require('bluebird');
const moment = require('moment');
const MongoClient = require('mongodb').MongoClient;
const ObjectId = require('mongodb').ObjectId;




exports.register = function (server, options, next) { // eslint-disable-line

  const getProfileData = (data) =>{ // eslint-disable-line
    return new Promise((resolve, reject) => {
      server.methods.getProfile(data.tag, data.additionalInfo.region, data.additionalInfo.platform, (err, result) => {
        if (!err) resolve(result);
        else { reject(err); }
      });
    });
  };

  const getHeroesProgressData = (data) => { // eslint-disable-line
    return new Promise((resolve, reject) => {
      server.methods.getHeroesProgress(data.tag, data.additionalInfo.region, data.additionalInfo.platform, 'quick-play', (err, result) => {
        const jsonResult = JSON.parse(result);
        if (!err) resolve(jsonResult[0]);
        else { reject(err); }
      });
    });
  };

  const downloadImage = (url, directory, fileName, sizeX, sizeY) => { // eslint-disable-line
    return new Promise((resolve, reject) => {
      fs.stat(`assets/${directory}/${fileName}`, (err) => {
        if (err !== null) {
          gm(request(url))
          .resize(sizeX, sizeY)
          .write(`assets/${directory}/${fileName}`, (err2) => {
            if (!err2) resolve(`assets/${directory}/${fileName}`);
            else { reject(err2); }
          });
        } else {
          resolve(`assets/${directory}/${fileName}`);
        }
      });
    });
  };

  const createBackgroundImage = (data, images) => { // eslint-disable-line
    return new Promise((resolve, reject) => {
      const json = data.data;

      let background;

      if (json.level < 100) {
        background = 'assets/backgrounds/extendednew.png';
      } else if (json.level < 200) {
        background = 'assets/backgrounds/extendednew.png';
      } else if (json.level < 300) {
        background = 'assets/backgrounds/extendednew.png';
      } else if (json.level < 400) {
        background = 'assets/backgrounds/extendednew.png';
      } else if (json.level < 500) {
        background = 'assets/backgrounds/extendednew.png';
      }

      const backgroundImage = gm();

      backgroundImage.in('-page', '+0+0');
      backgroundImage.in(background);

      for (let i = 0; i < images.length; i++) {
        backgroundImage.in('-page', images[i].position);
        backgroundImage.in(images[i].image);
      }
      backgroundImage.mosaic();
      backgroundImage.toBuffer('PNG', (err, buffer) => {
        if (!err) {
          resolve(buffer);
        } else { reject(err); }
      });
    });
  };


  const addStats = (backgroundImage, data) => { // eslint-disable-line
    return new Promise((resolve, reject) => {
      const json = data[0].data;

      const createQuickPlayImage = new Promise((finish, error) => {
        const manipulator = gm(backgroundImage);

        manipulator.font('assets/overwatch.ttf', 12);
        manipulator.fill('#ffd800');
        manipulator.fontSize('29');
        manipulator.drawText(175, -30, json.username.toUpperCase(), 'West');
        manipulator.fill('#fff');

        if (json.level < 100) {
          manipulator.drawText(23, -23, json.level, 'East');
        } else {
          manipulator.drawText(40, -25, json.level, 'East');
        }
        manipulator.fontSize('17');

        manipulator.drawText(165, 0, `Matches: ${json.games.quick.played}`, 'West');
        manipulator.drawText(165, 20, `Time played: ${json.playtime.quick}`, 'West');
        manipulator.drawText(165, 40, `Games Won: ${json.games.quick.wins}`, 'West');

        if (json.games.quick.played > 0) {
          const winRatio = json.games.quick.wins / json.games.quick.played;
          const percentage = Math.round((winRatio * 100)).toFixed(1);

          if (percentage < 50) {
            manipulator.fill('#ffd800');
          } else {
            manipulator.fill('#ffd800');
          }
          manipulator.drawText(305, 0, `Win (%): ${percentage} %`, 'West');
          manipulator.fill('#fff');
        }

        manipulator.resize(500, 100);

        manipulator.toBuffer('PNG', (err, buffer) => {
          const base64Image = new Buffer(buffer, 'binary').toString('base64');
          if (!err) {
            finish(base64Image);
          } else { error(err); }
        });
      });

      const CreateCompPlayImage = new Promise((finish, error) => {
        const manipulator = gm(backgroundImage);
        manipulator.font('assets/overwatch.ttf', 12);
        manipulator.fill('#ffd800');
        manipulator.fontSize('29');
        manipulator.drawText(175, -30, json.username.toUpperCase(), 'West');
        manipulator.fill('#fff');

        manipulator.fontSize('18');
        manipulator.drawText(165, 0, `Matches: ${json.games.competitive.played}`, 'West');
        manipulator.drawText(165, 40, `Games Won: ${json.games.competitive.wins}`, 'West');
        manipulator.drawText(165, 20, `Time played: ${json.playtime.competitive}`, 'West');

        manipulator.resize(500, 100);
        manipulator.toBuffer('PNG', (err, buffer) => {
          const base64Image = new Buffer(buffer, 'binary').toString('base64');
          if (!err) {
            finish(base64Image);
          } else { error(err); }
        });
      });

      promise.join(createQuickPlayImage, CreateCompPlayImage)
      .then((images) => {
        resolve({
          quickplayImage: images[0],
          competitivePlayImage: images[1],
        });
      }).catch((err) => {
        reject(err);
      });
    });
  };

  const updateSignature = function(id,next) { // eslint-disable-line

    promise.coroutine( function *() { // eslint-disable-line
      const db = yield MongoClient.connect('mongodb://localhost:27017/signatures', {
        server: {
          reconnectTries: Infinity,
          autoReconnect: true,
          socketOptions: {
            connectTimeoutMS: 5000,
            keepAlive: 1,
          },
        },
      });

      const user = yield db.collection('signatures').findOne({ _id: new ObjectId(id) }, { images: 0 });

      if (Object.prototype.hasOwnProperty.call(user, 'cacheTime')) {
        const diff = moment().diff(user.cacheTime, 'h');
        if (diff < 1) {
          const obj = { info: "Signatured is cached for one hour and can't be updated now." };
      	   return promise.resolve(obj);
        }
      }

      const data = yield promise.join(getProfileData(user), getHeroesProgressData(user));

      const starFileName = data[0].data.avatar.substr(48, 110).replace(/ /g, '');
      const avatarFileName = data[0].data.avatar.substr(48, 110).replace(/ /g, '');
      const heroFileName = data[1].image.substr(52, 110).replace(/ /g, '');

      let downloadImageArray = [ // eslint-disable-line
        downloadImage(data[0].data.avatar, 'avatars', avatarFileName, 94, 94),
        downloadImage(data[1].image, 'heroes', heroFileName, 26, 26),
      ];

      if (data[0].data.star.length !== 0) {
        downloadImageArray.push(downloadImage(data[0].data.star, 'stars', starFileName, 100, 100));
      }

      const images = yield promise.all(downloadImageArray);

      let imgArray = [ // eslint-disable-line
        { image: images[0], position: '+20+10' }, // avatar
        { image: images[1], position: '+144+16' }, // hero
      ];

      if (images.length === 3) {
        imgArray.push({ image: images[2], position: '+426+40' });
      }

      const background = yield createBackgroundImage(data[0], imgArray);
      const finalImage = yield addStats(background, data);

      const now = moment();

      yield db.collection('signatures').update(
           { _id: new ObjectId(id) },
           { $set: { images: finalImage, cacheTime: now } });

      const obj = { info: `The signature for the id:"${id}" got updated.` };
      return obj;
    })().then((data) => {  // eslint-disable-line
      return next(null, data);
    }).catch((err) => {
      console.log(err);
    });
  };

  server.method('updateSignature', updateSignature, {
  });

  server.route({
    method: 'GET',
    path: '/{id}/updateSignature',
    config: {
      tags: ['signature'],
      description: 'Get Stats for a specific hero',
      notes: ' ',
    },
    handler: (therequest, reply) => {
      const id = encodeURIComponent(request.params.id);

      server.methods.updateSignature(id, (err, result) => {
        if (err) {
          return reply(err);
        }

        return reply(result);
      });
    },
  });
  return next();
};

exports.register.attributes = {
  name: 'routes-updateSignature',
};
