"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ParseServerRESTController = ParseServerRESTController;
exports.default = void 0;

const Config = require('./Config');

const Auth = require('./Auth');

const RESTController = require('parse/lib/node/RESTController');

const URL = require('url');

const Parse = require('parse/node');

function getSessionToken(options) {
  if (options && typeof options.sessionToken === 'string') {
    return Promise.resolve(options.sessionToken);
  }

  return Promise.resolve(null);
}

function getAuth(options = {}, config) {
  const installationId = options.installationId || 'cloud';

  if (options.useMasterKey) {
    return Promise.resolve(new Auth.Auth({
      config,
      isMaster: true,
      installationId
    }));
  }

  return getSessionToken(options).then(sessionToken => {
    if (sessionToken) {
      options.sessionToken = sessionToken;
      return Auth.getAuthForSessionToken({
        config,
        sessionToken: sessionToken,
        installationId
      });
    } else {
      return Promise.resolve(new Auth.Auth({
        config,
        installationId
      }));
    }
  });
}

function ParseServerRESTController(applicationId, router) {
  function handleRequest(method, path, data = {}, options = {}, config) {
    // Store the arguments, for later use if internal fails
    const args = arguments;

    if (!config) {
      config = Config.get(applicationId);
    }

    const serverURL = URL.parse(config.serverURL);

    if (path.indexOf(serverURL.path) === 0) {
      path = path.slice(serverURL.path.length, path.length);
    }

    if (path[0] !== '/') {
      path = '/' + path;
    }

    if (path === '/batch') {
      let initialPromise = Promise.resolve();

      if (data.transaction === true) {
        initialPromise = config.database.createTransactionalSession();
      }

      return initialPromise.then(() => {
        const promises = data.requests.map(request => {
          return handleRequest(request.method, request.path, request.body, options, config).then(response => {
            return {
              success: response
            };
          }, error => {
            return {
              error: {
                code: error.code,
                error: error.message
              }
            };
          });
        });
        return Promise.all(promises).then(result => {
          if (data.transaction === true) {
            if (result.find(resultItem => typeof resultItem.error === 'object')) {
              return config.database.abortTransactionalSession().then(() => {
                return Promise.reject(result);
              });
            } else {
              return config.database.commitTransactionalSession().then(() => {
                return result;
              });
            }
          } else {
            return result;
          }
        });
      });
    }

    let query;

    if (method === 'GET') {
      query = data;
    }

    return new Promise((resolve, reject) => {
      getAuth(options, config).then(auth => {
        const request = {
          body: data,
          config,
          auth,
          info: {
            applicationId: applicationId,
            sessionToken: options.sessionToken,
            context: options.context || {} // Add context

          },
          query
        };
        return Promise.resolve().then(() => {
          return router.tryRouteRequest(method, path, request);
        }).then(response => {
          resolve(response.response, response.status, response);
        }, err => {
          if (err instanceof Parse.Error && err.code == Parse.Error.INVALID_JSON && err.message == `cannot route ${method} ${path}`) {
            RESTController.request.apply(null, args).then(resolve, reject);
          } else {
            reject(err);
          }
        });
      }, reject);
    });
  }

  return {
    request: handleRequest,
    ajax: RESTController.ajax
  };
}

var _default = ParseServerRESTController;
exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9QYXJzZVNlcnZlclJFU1RDb250cm9sbGVyLmpzIl0sIm5hbWVzIjpbIkNvbmZpZyIsInJlcXVpcmUiLCJBdXRoIiwiUkVTVENvbnRyb2xsZXIiLCJVUkwiLCJQYXJzZSIsImdldFNlc3Npb25Ub2tlbiIsIm9wdGlvbnMiLCJzZXNzaW9uVG9rZW4iLCJQcm9taXNlIiwicmVzb2x2ZSIsImdldEF1dGgiLCJjb25maWciLCJpbnN0YWxsYXRpb25JZCIsInVzZU1hc3RlcktleSIsImlzTWFzdGVyIiwidGhlbiIsImdldEF1dGhGb3JTZXNzaW9uVG9rZW4iLCJQYXJzZVNlcnZlclJFU1RDb250cm9sbGVyIiwiYXBwbGljYXRpb25JZCIsInJvdXRlciIsImhhbmRsZVJlcXVlc3QiLCJtZXRob2QiLCJwYXRoIiwiZGF0YSIsImFyZ3MiLCJhcmd1bWVudHMiLCJnZXQiLCJzZXJ2ZXJVUkwiLCJwYXJzZSIsImluZGV4T2YiLCJzbGljZSIsImxlbmd0aCIsImluaXRpYWxQcm9taXNlIiwidHJhbnNhY3Rpb24iLCJkYXRhYmFzZSIsImNyZWF0ZVRyYW5zYWN0aW9uYWxTZXNzaW9uIiwicHJvbWlzZXMiLCJyZXF1ZXN0cyIsIm1hcCIsInJlcXVlc3QiLCJib2R5IiwicmVzcG9uc2UiLCJzdWNjZXNzIiwiZXJyb3IiLCJjb2RlIiwibWVzc2FnZSIsImFsbCIsInJlc3VsdCIsImZpbmQiLCJyZXN1bHRJdGVtIiwiYWJvcnRUcmFuc2FjdGlvbmFsU2Vzc2lvbiIsInJlamVjdCIsImNvbW1pdFRyYW5zYWN0aW9uYWxTZXNzaW9uIiwicXVlcnkiLCJhdXRoIiwiaW5mbyIsImNvbnRleHQiLCJ0cnlSb3V0ZVJlcXVlc3QiLCJzdGF0dXMiLCJlcnIiLCJFcnJvciIsIklOVkFMSURfSlNPTiIsImFwcGx5IiwiYWpheCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7QUFBQSxNQUFNQSxNQUFNLEdBQUdDLE9BQU8sQ0FBQyxVQUFELENBQXRCOztBQUNBLE1BQU1DLElBQUksR0FBR0QsT0FBTyxDQUFDLFFBQUQsQ0FBcEI7O0FBQ0EsTUFBTUUsY0FBYyxHQUFHRixPQUFPLENBQUMsK0JBQUQsQ0FBOUI7O0FBQ0EsTUFBTUcsR0FBRyxHQUFHSCxPQUFPLENBQUMsS0FBRCxDQUFuQjs7QUFDQSxNQUFNSSxLQUFLLEdBQUdKLE9BQU8sQ0FBQyxZQUFELENBQXJCOztBQUVBLFNBQVNLLGVBQVQsQ0FBeUJDLE9BQXpCLEVBQWtDO0FBQ2hDLE1BQUlBLE9BQU8sSUFBSSxPQUFPQSxPQUFPLENBQUNDLFlBQWYsS0FBZ0MsUUFBL0MsRUFBeUQ7QUFDdkQsV0FBT0MsT0FBTyxDQUFDQyxPQUFSLENBQWdCSCxPQUFPLENBQUNDLFlBQXhCLENBQVA7QUFDRDs7QUFDRCxTQUFPQyxPQUFPLENBQUNDLE9BQVIsQ0FBZ0IsSUFBaEIsQ0FBUDtBQUNEOztBQUVELFNBQVNDLE9BQVQsQ0FBaUJKLE9BQU8sR0FBRyxFQUEzQixFQUErQkssTUFBL0IsRUFBdUM7QUFDckMsUUFBTUMsY0FBYyxHQUFHTixPQUFPLENBQUNNLGNBQVIsSUFBMEIsT0FBakQ7O0FBQ0EsTUFBSU4sT0FBTyxDQUFDTyxZQUFaLEVBQTBCO0FBQ3hCLFdBQU9MLE9BQU8sQ0FBQ0MsT0FBUixDQUNMLElBQUlSLElBQUksQ0FBQ0EsSUFBVCxDQUFjO0FBQUVVLE1BQUFBLE1BQUY7QUFBVUcsTUFBQUEsUUFBUSxFQUFFLElBQXBCO0FBQTBCRixNQUFBQTtBQUExQixLQUFkLENBREssQ0FBUDtBQUdEOztBQUNELFNBQU9QLGVBQWUsQ0FBQ0MsT0FBRCxDQUFmLENBQXlCUyxJQUF6QixDQUE4QlIsWUFBWSxJQUFJO0FBQ25ELFFBQUlBLFlBQUosRUFBa0I7QUFDaEJELE1BQUFBLE9BQU8sQ0FBQ0MsWUFBUixHQUF1QkEsWUFBdkI7QUFDQSxhQUFPTixJQUFJLENBQUNlLHNCQUFMLENBQTRCO0FBQ2pDTCxRQUFBQSxNQURpQztBQUVqQ0osUUFBQUEsWUFBWSxFQUFFQSxZQUZtQjtBQUdqQ0ssUUFBQUE7QUFIaUMsT0FBNUIsQ0FBUDtBQUtELEtBUEQsTUFPTztBQUNMLGFBQU9KLE9BQU8sQ0FBQ0MsT0FBUixDQUFnQixJQUFJUixJQUFJLENBQUNBLElBQVQsQ0FBYztBQUFFVSxRQUFBQSxNQUFGO0FBQVVDLFFBQUFBO0FBQVYsT0FBZCxDQUFoQixDQUFQO0FBQ0Q7QUFDRixHQVhNLENBQVA7QUFZRDs7QUFFRCxTQUFTSyx5QkFBVCxDQUFtQ0MsYUFBbkMsRUFBa0RDLE1BQWxELEVBQTBEO0FBQ3hELFdBQVNDLGFBQVQsQ0FBdUJDLE1BQXZCLEVBQStCQyxJQUEvQixFQUFxQ0MsSUFBSSxHQUFHLEVBQTVDLEVBQWdEakIsT0FBTyxHQUFHLEVBQTFELEVBQThESyxNQUE5RCxFQUFzRTtBQUNwRTtBQUNBLFVBQU1hLElBQUksR0FBR0MsU0FBYjs7QUFFQSxRQUFJLENBQUNkLE1BQUwsRUFBYTtBQUNYQSxNQUFBQSxNQUFNLEdBQUdaLE1BQU0sQ0FBQzJCLEdBQVAsQ0FBV1IsYUFBWCxDQUFUO0FBQ0Q7O0FBQ0QsVUFBTVMsU0FBUyxHQUFHeEIsR0FBRyxDQUFDeUIsS0FBSixDQUFVakIsTUFBTSxDQUFDZ0IsU0FBakIsQ0FBbEI7O0FBQ0EsUUFBSUwsSUFBSSxDQUFDTyxPQUFMLENBQWFGLFNBQVMsQ0FBQ0wsSUFBdkIsTUFBaUMsQ0FBckMsRUFBd0M7QUFDdENBLE1BQUFBLElBQUksR0FBR0EsSUFBSSxDQUFDUSxLQUFMLENBQVdILFNBQVMsQ0FBQ0wsSUFBVixDQUFlUyxNQUExQixFQUFrQ1QsSUFBSSxDQUFDUyxNQUF2QyxDQUFQO0FBQ0Q7O0FBRUQsUUFBSVQsSUFBSSxDQUFDLENBQUQsQ0FBSixLQUFZLEdBQWhCLEVBQXFCO0FBQ25CQSxNQUFBQSxJQUFJLEdBQUcsTUFBTUEsSUFBYjtBQUNEOztBQUVELFFBQUlBLElBQUksS0FBSyxRQUFiLEVBQXVCO0FBQ3JCLFVBQUlVLGNBQWMsR0FBR3hCLE9BQU8sQ0FBQ0MsT0FBUixFQUFyQjs7QUFDQSxVQUFJYyxJQUFJLENBQUNVLFdBQUwsS0FBcUIsSUFBekIsRUFBK0I7QUFDN0JELFFBQUFBLGNBQWMsR0FBR3JCLE1BQU0sQ0FBQ3VCLFFBQVAsQ0FBZ0JDLDBCQUFoQixFQUFqQjtBQUNEOztBQUNELGFBQU9ILGNBQWMsQ0FBQ2pCLElBQWYsQ0FBb0IsTUFBTTtBQUMvQixjQUFNcUIsUUFBUSxHQUFHYixJQUFJLENBQUNjLFFBQUwsQ0FBY0MsR0FBZCxDQUFrQkMsT0FBTyxJQUFJO0FBQzVDLGlCQUFPbkIsYUFBYSxDQUNsQm1CLE9BQU8sQ0FBQ2xCLE1BRFUsRUFFbEJrQixPQUFPLENBQUNqQixJQUZVLEVBR2xCaUIsT0FBTyxDQUFDQyxJQUhVLEVBSWxCbEMsT0FKa0IsRUFLbEJLLE1BTGtCLENBQWIsQ0FNTEksSUFOSyxDQU9MMEIsUUFBUSxJQUFJO0FBQ1YsbUJBQU87QUFBRUMsY0FBQUEsT0FBTyxFQUFFRDtBQUFYLGFBQVA7QUFDRCxXQVRJLEVBVUxFLEtBQUssSUFBSTtBQUNQLG1CQUFPO0FBQ0xBLGNBQUFBLEtBQUssRUFBRTtBQUFFQyxnQkFBQUEsSUFBSSxFQUFFRCxLQUFLLENBQUNDLElBQWQ7QUFBb0JELGdCQUFBQSxLQUFLLEVBQUVBLEtBQUssQ0FBQ0U7QUFBakM7QUFERixhQUFQO0FBR0QsV0FkSSxDQUFQO0FBZ0JELFNBakJnQixDQUFqQjtBQWtCQSxlQUFPckMsT0FBTyxDQUFDc0MsR0FBUixDQUFZVixRQUFaLEVBQXNCckIsSUFBdEIsQ0FBMkJnQyxNQUFNLElBQUk7QUFDMUMsY0FBSXhCLElBQUksQ0FBQ1UsV0FBTCxLQUFxQixJQUF6QixFQUErQjtBQUM3QixnQkFDRWMsTUFBTSxDQUFDQyxJQUFQLENBQVlDLFVBQVUsSUFBSSxPQUFPQSxVQUFVLENBQUNOLEtBQWxCLEtBQTRCLFFBQXRELENBREYsRUFFRTtBQUNBLHFCQUFPaEMsTUFBTSxDQUFDdUIsUUFBUCxDQUFnQmdCLHlCQUFoQixHQUE0Q25DLElBQTVDLENBQWlELE1BQU07QUFDNUQsdUJBQU9QLE9BQU8sQ0FBQzJDLE1BQVIsQ0FBZUosTUFBZixDQUFQO0FBQ0QsZUFGTSxDQUFQO0FBR0QsYUFORCxNQU1PO0FBQ0wscUJBQU9wQyxNQUFNLENBQUN1QixRQUFQLENBQWdCa0IsMEJBQWhCLEdBQTZDckMsSUFBN0MsQ0FBa0QsTUFBTTtBQUM3RCx1QkFBT2dDLE1BQVA7QUFDRCxlQUZNLENBQVA7QUFHRDtBQUNGLFdBWkQsTUFZTztBQUNMLG1CQUFPQSxNQUFQO0FBQ0Q7QUFDRixTQWhCTSxDQUFQO0FBaUJELE9BcENNLENBQVA7QUFxQ0Q7O0FBRUQsUUFBSU0sS0FBSjs7QUFDQSxRQUFJaEMsTUFBTSxLQUFLLEtBQWYsRUFBc0I7QUFDcEJnQyxNQUFBQSxLQUFLLEdBQUc5QixJQUFSO0FBQ0Q7O0FBRUQsV0FBTyxJQUFJZixPQUFKLENBQVksQ0FBQ0MsT0FBRCxFQUFVMEMsTUFBVixLQUFxQjtBQUN0Q3pDLE1BQUFBLE9BQU8sQ0FBQ0osT0FBRCxFQUFVSyxNQUFWLENBQVAsQ0FBeUJJLElBQXpCLENBQThCdUMsSUFBSSxJQUFJO0FBQ3BDLGNBQU1mLE9BQU8sR0FBRztBQUNkQyxVQUFBQSxJQUFJLEVBQUVqQixJQURRO0FBRWRaLFVBQUFBLE1BRmM7QUFHZDJDLFVBQUFBLElBSGM7QUFJZEMsVUFBQUEsSUFBSSxFQUFFO0FBQ0pyQyxZQUFBQSxhQUFhLEVBQUVBLGFBRFg7QUFFSlgsWUFBQUEsWUFBWSxFQUFFRCxPQUFPLENBQUNDLFlBRmxCO0FBR0ppRCxZQUFBQSxPQUFPLEVBQUVsRCxPQUFPLENBQUNrRCxPQUFSLElBQW1CLEVBSHhCLENBRzRCOztBQUg1QixXQUpRO0FBU2RILFVBQUFBO0FBVGMsU0FBaEI7QUFXQSxlQUFPN0MsT0FBTyxDQUFDQyxPQUFSLEdBQ0pNLElBREksQ0FDQyxNQUFNO0FBQ1YsaUJBQU9JLE1BQU0sQ0FBQ3NDLGVBQVAsQ0FBdUJwQyxNQUF2QixFQUErQkMsSUFBL0IsRUFBcUNpQixPQUFyQyxDQUFQO0FBQ0QsU0FISSxFQUlKeEIsSUFKSSxDQUtIMEIsUUFBUSxJQUFJO0FBQ1ZoQyxVQUFBQSxPQUFPLENBQUNnQyxRQUFRLENBQUNBLFFBQVYsRUFBb0JBLFFBQVEsQ0FBQ2lCLE1BQTdCLEVBQXFDakIsUUFBckMsQ0FBUDtBQUNELFNBUEUsRUFRSGtCLEdBQUcsSUFBSTtBQUNMLGNBQ0VBLEdBQUcsWUFBWXZELEtBQUssQ0FBQ3dELEtBQXJCLElBQ0FELEdBQUcsQ0FBQ2YsSUFBSixJQUFZeEMsS0FBSyxDQUFDd0QsS0FBTixDQUFZQyxZQUR4QixJQUVBRixHQUFHLENBQUNkLE9BQUosSUFBZ0IsZ0JBQWV4QixNQUFPLElBQUdDLElBQUssRUFIaEQsRUFJRTtBQUNBcEIsWUFBQUEsY0FBYyxDQUFDcUMsT0FBZixDQUF1QnVCLEtBQXZCLENBQTZCLElBQTdCLEVBQW1DdEMsSUFBbkMsRUFBeUNULElBQXpDLENBQThDTixPQUE5QyxFQUF1RDBDLE1BQXZEO0FBQ0QsV0FORCxNQU1PO0FBQ0xBLFlBQUFBLE1BQU0sQ0FBQ1EsR0FBRCxDQUFOO0FBQ0Q7QUFDRixTQWxCRSxDQUFQO0FBb0JELE9BaENELEVBZ0NHUixNQWhDSDtBQWlDRCxLQWxDTSxDQUFQO0FBbUNEOztBQUVELFNBQU87QUFDTFosSUFBQUEsT0FBTyxFQUFFbkIsYUFESjtBQUVMMkMsSUFBQUEsSUFBSSxFQUFFN0QsY0FBYyxDQUFDNkQ7QUFGaEIsR0FBUDtBQUlEOztlQUVjOUMseUIiLCJzb3VyY2VzQ29udGVudCI6WyJjb25zdCBDb25maWcgPSByZXF1aXJlKCcuL0NvbmZpZycpO1xuY29uc3QgQXV0aCA9IHJlcXVpcmUoJy4vQXV0aCcpO1xuY29uc3QgUkVTVENvbnRyb2xsZXIgPSByZXF1aXJlKCdwYXJzZS9saWIvbm9kZS9SRVNUQ29udHJvbGxlcicpO1xuY29uc3QgVVJMID0gcmVxdWlyZSgndXJsJyk7XG5jb25zdCBQYXJzZSA9IHJlcXVpcmUoJ3BhcnNlL25vZGUnKTtcblxuZnVuY3Rpb24gZ2V0U2Vzc2lvblRva2VuKG9wdGlvbnMpIHtcbiAgaWYgKG9wdGlvbnMgJiYgdHlwZW9mIG9wdGlvbnMuc2Vzc2lvblRva2VuID09PSAnc3RyaW5nJykge1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUob3B0aW9ucy5zZXNzaW9uVG9rZW4pO1xuICB9XG4gIHJldHVybiBQcm9taXNlLnJlc29sdmUobnVsbCk7XG59XG5cbmZ1bmN0aW9uIGdldEF1dGgob3B0aW9ucyA9IHt9LCBjb25maWcpIHtcbiAgY29uc3QgaW5zdGFsbGF0aW9uSWQgPSBvcHRpb25zLmluc3RhbGxhdGlvbklkIHx8ICdjbG91ZCc7XG4gIGlmIChvcHRpb25zLnVzZU1hc3RlcktleSkge1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoXG4gICAgICBuZXcgQXV0aC5BdXRoKHsgY29uZmlnLCBpc01hc3RlcjogdHJ1ZSwgaW5zdGFsbGF0aW9uSWQgfSlcbiAgICApO1xuICB9XG4gIHJldHVybiBnZXRTZXNzaW9uVG9rZW4ob3B0aW9ucykudGhlbihzZXNzaW9uVG9rZW4gPT4ge1xuICAgIGlmIChzZXNzaW9uVG9rZW4pIHtcbiAgICAgIG9wdGlvbnMuc2Vzc2lvblRva2VuID0gc2Vzc2lvblRva2VuO1xuICAgICAgcmV0dXJuIEF1dGguZ2V0QXV0aEZvclNlc3Npb25Ub2tlbih7XG4gICAgICAgIGNvbmZpZyxcbiAgICAgICAgc2Vzc2lvblRva2VuOiBzZXNzaW9uVG9rZW4sXG4gICAgICAgIGluc3RhbGxhdGlvbklkLFxuICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUobmV3IEF1dGguQXV0aCh7IGNvbmZpZywgaW5zdGFsbGF0aW9uSWQgfSkpO1xuICAgIH1cbiAgfSk7XG59XG5cbmZ1bmN0aW9uIFBhcnNlU2VydmVyUkVTVENvbnRyb2xsZXIoYXBwbGljYXRpb25JZCwgcm91dGVyKSB7XG4gIGZ1bmN0aW9uIGhhbmRsZVJlcXVlc3QobWV0aG9kLCBwYXRoLCBkYXRhID0ge30sIG9wdGlvbnMgPSB7fSwgY29uZmlnKSB7XG4gICAgLy8gU3RvcmUgdGhlIGFyZ3VtZW50cywgZm9yIGxhdGVyIHVzZSBpZiBpbnRlcm5hbCBmYWlsc1xuICAgIGNvbnN0IGFyZ3MgPSBhcmd1bWVudHM7XG5cbiAgICBpZiAoIWNvbmZpZykge1xuICAgICAgY29uZmlnID0gQ29uZmlnLmdldChhcHBsaWNhdGlvbklkKTtcbiAgICB9XG4gICAgY29uc3Qgc2VydmVyVVJMID0gVVJMLnBhcnNlKGNvbmZpZy5zZXJ2ZXJVUkwpO1xuICAgIGlmIChwYXRoLmluZGV4T2Yoc2VydmVyVVJMLnBhdGgpID09PSAwKSB7XG4gICAgICBwYXRoID0gcGF0aC5zbGljZShzZXJ2ZXJVUkwucGF0aC5sZW5ndGgsIHBhdGgubGVuZ3RoKTtcbiAgICB9XG5cbiAgICBpZiAocGF0aFswXSAhPT0gJy8nKSB7XG4gICAgICBwYXRoID0gJy8nICsgcGF0aDtcbiAgICB9XG5cbiAgICBpZiAocGF0aCA9PT0gJy9iYXRjaCcpIHtcbiAgICAgIGxldCBpbml0aWFsUHJvbWlzZSA9IFByb21pc2UucmVzb2x2ZSgpO1xuICAgICAgaWYgKGRhdGEudHJhbnNhY3Rpb24gPT09IHRydWUpIHtcbiAgICAgICAgaW5pdGlhbFByb21pc2UgPSBjb25maWcuZGF0YWJhc2UuY3JlYXRlVHJhbnNhY3Rpb25hbFNlc3Npb24oKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBpbml0aWFsUHJvbWlzZS50aGVuKCgpID0+IHtcbiAgICAgICAgY29uc3QgcHJvbWlzZXMgPSBkYXRhLnJlcXVlc3RzLm1hcChyZXF1ZXN0ID0+IHtcbiAgICAgICAgICByZXR1cm4gaGFuZGxlUmVxdWVzdChcbiAgICAgICAgICAgIHJlcXVlc3QubWV0aG9kLFxuICAgICAgICAgICAgcmVxdWVzdC5wYXRoLFxuICAgICAgICAgICAgcmVxdWVzdC5ib2R5LFxuICAgICAgICAgICAgb3B0aW9ucyxcbiAgICAgICAgICAgIGNvbmZpZ1xuICAgICAgICAgICkudGhlbihcbiAgICAgICAgICAgIHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgICAgcmV0dXJuIHsgc3VjY2VzczogcmVzcG9uc2UgfTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBlcnJvciA9PiB7XG4gICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgZXJyb3I6IHsgY29kZTogZXJyb3IuY29kZSwgZXJyb3I6IGVycm9yLm1lc3NhZ2UgfSxcbiAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICApO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIFByb21pc2UuYWxsKHByb21pc2VzKS50aGVuKHJlc3VsdCA9PiB7XG4gICAgICAgICAgaWYgKGRhdGEudHJhbnNhY3Rpb24gPT09IHRydWUpIHtcbiAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgcmVzdWx0LmZpbmQocmVzdWx0SXRlbSA9PiB0eXBlb2YgcmVzdWx0SXRlbS5lcnJvciA9PT0gJ29iamVjdCcpXG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgcmV0dXJuIGNvbmZpZy5kYXRhYmFzZS5hYm9ydFRyYW5zYWN0aW9uYWxTZXNzaW9uKCkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KHJlc3VsdCk7XG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgcmV0dXJuIGNvbmZpZy5kYXRhYmFzZS5jb21taXRUcmFuc2FjdGlvbmFsU2Vzc2lvbigpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBsZXQgcXVlcnk7XG4gICAgaWYgKG1ldGhvZCA9PT0gJ0dFVCcpIHtcbiAgICAgIHF1ZXJ5ID0gZGF0YTtcbiAgICB9XG5cbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgZ2V0QXV0aChvcHRpb25zLCBjb25maWcpLnRoZW4oYXV0aCA9PiB7XG4gICAgICAgIGNvbnN0IHJlcXVlc3QgPSB7XG4gICAgICAgICAgYm9keTogZGF0YSxcbiAgICAgICAgICBjb25maWcsXG4gICAgICAgICAgYXV0aCxcbiAgICAgICAgICBpbmZvOiB7XG4gICAgICAgICAgICBhcHBsaWNhdGlvbklkOiBhcHBsaWNhdGlvbklkLFxuICAgICAgICAgICAgc2Vzc2lvblRva2VuOiBvcHRpb25zLnNlc3Npb25Ub2tlbixcbiAgICAgICAgICAgIGNvbnRleHQ6IG9wdGlvbnMuY29udGV4dCB8fCB7fSwgLy8gQWRkIGNvbnRleHRcbiAgICAgICAgICB9LFxuICAgICAgICAgIHF1ZXJ5LFxuICAgICAgICB9O1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKClcbiAgICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gcm91dGVyLnRyeVJvdXRlUmVxdWVzdChtZXRob2QsIHBhdGgsIHJlcXVlc3QpO1xuICAgICAgICAgIH0pXG4gICAgICAgICAgLnRoZW4oXG4gICAgICAgICAgICByZXNwb25zZSA9PiB7XG4gICAgICAgICAgICAgIHJlc29sdmUocmVzcG9uc2UucmVzcG9uc2UsIHJlc3BvbnNlLnN0YXR1cywgcmVzcG9uc2UpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGVyciA9PiB7XG4gICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICBlcnIgaW5zdGFuY2VvZiBQYXJzZS5FcnJvciAmJlxuICAgICAgICAgICAgICAgIGVyci5jb2RlID09IFBhcnNlLkVycm9yLklOVkFMSURfSlNPTiAmJlxuICAgICAgICAgICAgICAgIGVyci5tZXNzYWdlID09IGBjYW5ub3Qgcm91dGUgJHttZXRob2R9ICR7cGF0aH1gXG4gICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgIFJFU1RDb250cm9sbGVyLnJlcXVlc3QuYXBwbHkobnVsbCwgYXJncykudGhlbihyZXNvbHZlLCByZWplY3QpO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJlamVjdChlcnIpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgKTtcbiAgICAgIH0sIHJlamVjdCk7XG4gICAgfSk7XG4gIH1cblxuICByZXR1cm4ge1xuICAgIHJlcXVlc3Q6IGhhbmRsZVJlcXVlc3QsXG4gICAgYWpheDogUkVTVENvbnRyb2xsZXIuYWpheCxcbiAgfTtcbn1cblxuZXhwb3J0IGRlZmF1bHQgUGFyc2VTZXJ2ZXJSRVNUQ29udHJvbGxlcjtcbmV4cG9ydCB7IFBhcnNlU2VydmVyUkVTVENvbnRyb2xsZXIgfTtcbiJdfQ==