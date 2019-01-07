const $ = require('jquery');
const _ = require('lodash');

const Node = require('../interface/node');
const Endpoint = require('../endpoint/baseEndpoint');

class BaseNode extends Node {
  constructor(opts) {
    super(opts);
    this.id = opts.id;
    this.group = opts.group;
    this.top = opts.top || 0;
    this.left = opts.left || 0;
    this.dom = opts.dom || null;
    this.options = opts;
    this._on = opts._on;
    this._emit = opts._emit;
    // endpoint 这部分需要考虑
    this.endpoints = [];
    this._endpointsData = opts.endpoints;
  }
  draw(obj) {
    let _dom = obj.dom;
    if (!_dom) {
      _dom = $('<div></div>')
                .attr('class', 'node')
                .attr('id', obj.id);
    }
    let node = $(_dom);
    if (obj.top) {
      node.css('top', obj.top + 'px');
    }
    if (obj.left) {
      node.css('left', obj.left + 'px');
    }
    return _dom[0];
  }
  focus() {}
  unFocus() {}
  addEndpoint(obj, isInited) {
    if (isInited) {
      this._emit('InnerEvents', {
        type: 'node:addEndpoint',
        data: obj,
        isInited: isInited
      });
      return obj;
    } else {
      // 这部分可能还需要想一下
      let EndpointClass = obj.Class || Endpoint;
      let endpoint = new EndpointClass(_.assign({
        _on: this._on,
        _emit: this._emit,
        _node: this
      }, obj));

      this._emit('InnerEvents', {
        type: 'node:addEndpoint',
        data: endpoint,
      });
      this.endpoints.push(endpoint);
      return endpoint;
    }
  }
  rmEndpoint(pointId) {
    let rmEndpointIndex = _.findIndex(this.endpoints, (point) => {
      return point.id === pointId;
    });
    if (rmEndpointIndex !== -1) {
      let rmEndpoint = this.endpoints.splice(rmEndpointIndex, 1)[0];
      rmEndpoint.destroy();
      return rmEndpoint;
    }
  }
  getEndpoint(pointId) {
    return _.find(this.endpoints, (point) => {
      return pointId === point.id;
    });
  }
  _init(obj = {}) {
    if (this._isInited) {
      return;
    }
    // 这里可以抽象下，和constructor对比
    if (obj.left) {
      this.left = obj.left;
    }
    if (obj.top) {
      this.top = obj.top;
    }
    if (obj._isDeleteGroup) {
      this.group = undefined;
      this._group = undefined;
    } else {
      obj.group && (this.group = obj.group);
    }

    delete obj._isDeleteGroup;
    this._isInited = true;
    if (obj.dom) {
      this.dom = obj.dom;
    } else {
      this.dom = this.draw(_.assign({
        id: this.id,
        top: this.top,
        left: this.left,
        dom: this.dom,
        options: this.options
      }, obj));
  
      this._addEventLinster();
    }
  }
  // drag的时候移动的api
  moveTo(x, y) {
    // 自身移动
    $(this.dom).css('top', y).css('left', x);
    // 所在的点移动
    this.endpoints.forEach((item) => {
      item.moveTo(x - this.left + item._left, y - this.top + item._top);
    });
    this.top = y;
    this.left = x;
  }
  getWidth() {
    return $(this.dom).width();
  }
  getHeight() {
    return $(this.dom).height();
  }
  _createEndpoint(isInited) {
    if (isInited) {
      this.endpoints.forEach((item) => {
        return this.addEndpoint(item, isInited);
      });
    } else {
      if (this._endpointsData) {
        this._endpointsData.map((item) => {
          return this.addEndpoint(item);
        });
      }
    }
  }
  _addEventLinster() {
    $(this.dom).on('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this._emit('system.node.click', {
        node: this
      });
      this._emit('events', {
        type: 'node:click',
        node: this
      });
    });

    $(this.dom).on('mousedown', (e) => {
      let LEFT_KEY = 0;
      if (!e.button === LEFT_KEY) {
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      this._emit('InnerEvents', {
        type: 'node:dragBegin',
        data: this
      });
    });
  }
  destroy(isNotEvent) {
    if (!isNotEvent) {
      this._emit('system.node.delete', {
        node: this
      });
      this._emit('events', {
        type: 'node:delete',
        node: this
      });
      this.endpoints.forEach((item) => {
        item.destroy();
      });
    } else {
      this.endpoints.forEach((item) => {
        !item._isInitedDom && item.destroy();
      });
    }
    this._isInited = false;
    $(this.dom).remove();
  }
}

module.exports = BaseNode;
