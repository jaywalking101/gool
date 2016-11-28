/**
 * PhysicsJS v0.6.0 - 2014-06-10
 * A modular, extendable, and easy-to-use physics engine for javascript
 * http://wellcaffeinated.net/PhysicsJS
 *
 * Copyright (c) 2014 Jasper Palfree <jasper@wellcaffeinated.net>
 * Licensed MIT
 */
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(['physicsjs'], factory);
    } else if (typeof exports === 'object') {
        module.exports = factory.apply(root, ['physicsjs'].map(require));
    } else {
        factory.call(root, root.Physics);
    }
}(this, function (Physics) {
    'use strict';
    Physics.integrator('metre-per-second-squared-verlet', function( parent ){
        // for this integrator we need to know if the object has been integrated before
        // so let's add a mixin to bodies
        Physics.body.mixin({
            started: function( val ){
                if ( val !== undefined ){
                    this._started = true;
                }
                return !!this._started;
            }
        });
        return {
            /**
             * class Verlet < Integrator
             *
             * `Physics.integrator('verlet')`.
             *
             * The verlet integrator.
             **/
            // extended
            init: function( options ){
                // call parent init
                options.metre = options.metre || 41;
                parent.init.call(this, options);
            },
            // extended
            integrateVelocities: function( bodies, dt ){
                // time in milliseconds becomes time in seconds
                dt /= 1000;
                // timestep squared
                var dtdt = dt * dt
                    ,drag = 1 - this.options.drag
                    ,body = null
                    ,state
                    ,metre = this.options.metre
                    ;
                for ( var i = 0, l = bodies.length; i < l; ++i ){
                    body = bodies[ i ];
                    state = body.state;
                    // only integrate if the body isn't static
                    if ( body.treatment !== 'static' ){
                        // Inspired from https://github.com/soulwire/Coffee-Physics
                        // @licence MIT
                        //
                        // v = x - ox
                        // x = x + (v + a * dt * dt)
                        // use the velocity in vel if the velocity has been changed manually
                        if (state.vel.equals( state.old.vel ) && body.started()){
                            // Get velocity by subtracting old position from curr position
                            state.vel.clone( state.pos ).vsub( state.old.pos );
                        } else {
                            state.old.pos.clone( state.pos ).vsub( state.vel );
                            // so we need to scale the value by dt so it
                            // complies with other integration methods
                            state.vel.mult( dt );
                        }
                        // Apply "air resistance".
                        if ( drag ){
                            state.vel.mult( drag );
                        }
                        // Apply acceleration
                        // v += a * dt * dt
                        state.vel.vadd( state.acc.mult( dtdt * metre ) );
                        // normalize velocity
                        state.vel.mult( 1/dt );
                        // store calculated velocity
                        state.old.vel.clone( state.vel );
                        // Reset accel
                        state.acc.zero();
                        //
                        // Angular components
                        //
                        if (state.angular.vel === state.old.angular.vel && body.started()){
                            state.angular.vel = (state.angular.pos - state.old.angular.pos);
                        } else {
                            state.old.angular.pos = state.angular.pos - state.angular.vel;
                            state.angular.vel *= dt;
                        }
                        state.angular.vel += state.angular.acc * dtdt;
                        state.angular.vel /= dt;
                        state.old.angular.vel = state.angular.vel;
                        state.angular.acc = 0;
                        body.started( true );
                    } else {
                        // set the velocity and acceleration to zero!
                        state.vel.zero();
                        state.acc.zero();
                        state.angular.vel = 0;
                        state.angular.acc = 0;
                    }
                }
            },
            // extended
            integratePositions: function( bodies, dt ){
                // time in milliseconds becomes time in seconds
                dt /= 1000;
                var body = null
                    ,state
                    ;
                for ( var i = 0, l = bodies.length; i < l; ++i ){
                    body = bodies[ i ];
                    state = body.state;
                    // only integrate if the body isn't static
                    if ( body.treatment !== 'static' ){
                        // so we need to scale the value by dt so it
                        // complies with other integration methods
                        state.vel.mult( dt );
                        // Store old position.
                        // xold = x
                        state.old.pos.clone( state.pos );
                        state.pos.vadd( state.vel );
                        // normalize velocity
                        state.vel.mult( 1/dt );
                        // store calculated velocity
                        state.old.vel.clone( state.vel );
                        //
                        // Angular components
                        //
                        state.angular.vel *= dt;
                        state.old.angular.pos = state.angular.pos;
                        state.angular.pos += state.angular.vel;
                        state.angular.vel /= dt;
                        state.old.angular.vel = state.angular.vel;
                    }
                }
            }
        };
    });

    // end module: integrators/metre-per-second-squared-verlet.js
    return Physics;
}));// UMD
