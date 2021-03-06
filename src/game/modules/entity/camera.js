import { Focus } from "./focus";
import { math } from "../helper/math";
import { vec2 } from "../../modules/helper/vec2";
import { hooks } from "../singleton/hooks";

export const Camera = {
  create: function create(
    width,
    height,
    xPosition,
    yPosition,
    drawFocus,
    whomToFollow,
  ) {
    xPosition = xPosition || 0;
    yPosition = yPosition || 0;

    const camera = Object.create(this.prototype);

    camera.viewport = vec2.fromValues(width, height);
    camera.position = vec2.fromValues(xPosition, yPosition);
    camera.followedOne = whomToFollow;
    camera.focus = drawFocus === true ? Focus.create() : false;
    camera.free = false;
    camera.minZoom = 0.8;
    camera.maxZoom = 1.1;
    camera.zoom = camera.minZoom;

    // register event listeners
    camera.register();

    return camera;
  },

  prototype: {
    draw(context, metre) {
      if (this.focus) {
        this.focus.draw(context, metre, this.position, this.free, false);

        if (this.followedOne) {
          this.focus.draw(
            context,
            metre,
            this.followedOne.position,
            this.free,
            true,
          );
        }
      }
    },

    follow(whomToFollow) {
      this.followedOne = whomToFollow;
    },

    getBounds(specificBound) {
      switch (specificBound) {
        case "top":
          return this.position[1] + this.viewport[1] / 2 / this.zoom;
        case "right":
          return this.position[0] - this.viewport[0] / 2 / this.zoom;
        case "bottom":
          return this.position[1] - this.viewport[1] / 2 / this.zoom;
        case "left":
          return this.position[0] + this.viewport[0] / 2 / this.zoom;
        default:
          return {
            top: this.position[1] + this.viewport[1] / 2 / this.zoom,
            right: this.position[0] - this.viewport[0] / 2 / this.zoom,
            bottom: this.position[1] - this.viewport[1] / 2 / this.zoom,
            left: this.position[0] + this.viewport[0] / 2 / this.zoom,
          };
      }
    },

    randomViewportPosition() {
      return vec2.fromValues(
        math.random(0, this.viewport[0]),
        math.random(0, this.viewport[1]),
      );
    },

    register() {
      hooks.keydown(function (event) {
        if (event.keyCode === 70) {
          this.free = !this.free;
          if (this.free === true && this.followedOne) {
            this.position[0] -= 10;
            this.position[1] -= 10;
          }
        }
      }, this);

      hooks.resize(function (event) {
        if (event) {
          vec2.set(
            this.viewport,
            event.target.innerWidth,
            event.target.innerHeight,
          );
        }
      }, this);
    },

    update(keys) {
      if (this.free) {
        if (keys.UP) {
          this.position[1] -= 10;
        }

        if (keys.RIGHT) {
          this.position[0] += 10;
        }

        if (keys.DOWN) {
          this.position[1] += 10;
        }

        if (keys.LEFT) {
          this.position[0] -= 10;
        }
      }

      if (!this.free && this.followedOne) {
        vec2.lerp(
          this.position,
          this.position,
          this.followedOne.position,
          0.05,
        );
      }

      if (this.focus) {
        this.focus.update();
      }
    },

    viewportPosition(position, radius, type) {
      radius = radius || 0;

      const viewportBounds = {
        top: this.position[1] - this.viewport[1] / 2 / this.zoom - radius,
        right: this.position[0] + this.viewport[0] / 2 / this.zoom + radius,
        bottom: this.position[1] + this.viewport[1] / 2 / this.zoom + radius,
        left: this.position[0] - this.viewport[0] / 2 / this.zoom - radius,
      };

      const response = {
        isInViewport: true,
        outOfViewportMap: {
          top: false,
          right: false,
          bottom: false,
          left: false,
        },
      };

      if (position[1] < viewportBounds.top) {
        if (type === "trueOrFalseOnly") {
          return false;
        }
        response.isInViewport = false;
        response.outOfViewportMap.top = true;
      }

      if (position[0] > viewportBounds.right) {
        if (type === "trueOrFalseOnly") {
          return false;
        }
        response.isInViewport = false;
        response.outOfViewportMap.right = true;
      }

      if (position[1] > viewportBounds.bottom) {
        if (type === "trueOrFalseOnly") {
          return false;
        }
        response.isInViewport = false;
        response.outOfViewportMap.bottom = true;
      }

      if (position[0] < viewportBounds.left) {
        if (type === "trueOrFalseOnly") {
          return false;
        }
        response.isInViewport = false;
        response.outOfViewportMap.left = true;
      }

      if (type === "trueOrFalseOnly") {
        return true;
      }

      return response;
    },

    worldPositionFromViewportPosition(viewportPosition) {
      const temp = vec2.create();

      vec2.scale(temp, this.viewport, 1 / 2);
      vec2.subtract(temp, this.position, temp);
      vec2.add(temp, viewportPosition, temp);
      vec2.scale(temp, temp, 1 / this.zoom);

      return temp;
    },
  },
};
