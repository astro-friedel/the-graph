(function (context) {
  "use strict";

  var TheGraph = context.TheGraph;

  var config = TheGraph.config.group = {
    container: {
      className: "group"
    },
    boxRect: {
      ref: "box",
      rx: TheGraph.config.nodeRadius,
      ry: TheGraph.config.nodeRadius
    },
    labelText: {
      ref: "label",
      className: "group-label drag"
    },
    descriptionText: {
      className: "group-description"
    }
  };

  var factories = TheGraph.factories.group = {
    createGroupGroup: TheGraph.factories.createGroup,
    createGroupBoxRect: TheGraph.factories.createRect,
    createGroupLabelText: TheGraph.factories.createText,
    createGroupDescriptionText: TheGraph.factories.createText
  };

  // Group view

  TheGraph.Group = React.createClass({
    componentDidMount: function () {
      // Move group
      if (this.props.isSelectionGroup) {
        // Drag selection by bg
        this.refs.box.getDOMNode().addEventListener("trackstart", this.onTrackStart);
      } else {
        this.refs.label.getDOMNode().addEventListener("trackstart", this.onTrackStart);
      }

      // Don't pan under menu
      this.getDOMNode().addEventListener("trackstart", this.dontPan);

      // Context menu
      if (this.props.showContext) {
        this.getDOMNode().addEventListener("contextmenu", this.showContext);
        this.getDOMNode().addEventListener("hold", this.showContext);
      }

      // HACK to change SVG class https://github.com/facebook/react/issues/1139
      this.componentDidUpdate();
    },
    showContext: function (event) {
      // Don't show native context menu
      event.preventDefault();

      // Don't tap graph on hold event
      event.stopPropagation();
      if (event.preventTap) { event.preventTap(); }

      // Get mouse position
      var x = event.x || event.clientX || 0;
      var y = event.y || event.clientY || 0;

      // App.showContext
      this.props.showContext({
        element: this,
        type: (this.props.isSelectionGroup ? "selection" : "group"),
        x: x,
        y: y,
        graph: this.props.graph,
        itemKey: this.props.label,
        item: this.props.item
      });
    },
    getContext: function (menu, options, hide) {
      return TheGraph.Menu({
        menu: menu,
        options: options,
        label: this.props.label,
        triggerHideContext: hide
      });
    },
    dontPan: function (event) {
      // Don't drag under menu
      if (this.props.app.menuShown) {
        event.stopPropagation();
      }
    },
    onTrackStart: function (event) {
      // Don't drag graph
      event.stopPropagation();

      if (this.props.isSelectionGroup) {
        var box = this.refs.box.getDOMNode();
        box.addEventListener("track", this.onTrack);
        box.addEventListener("trackend", this.onTrackEnd);
      } else {
        var label = this.refs.label.getDOMNode();
        label.addEventListener("track", this.onTrack);
        label.addEventListener("trackend", this.onTrackEnd);
      }

      this.props.graph.startTransaction('movegroup');
    },
    onTrack: function (event) {
      // Don't fire on graph
      event.stopPropagation();

      var deltaX = Math.round( event.ddx / this.props.scale );
      var deltaY = Math.round( event.ddy / this.props.scale );

      this.props.triggerMoveGroup(this.props.item.nodes, deltaX, deltaY);
    },
    onTrackEnd: function (event) {
      // Don't fire on graph
      event.stopPropagation();

      // Don't tap graph (deselect)
      event.preventTap();

      // Snap to grid
      this.props.triggerMoveGroup(this.props.item.nodes);

      if (this.props.isSelectionGroup) {
        var box = this.refs.box.getDOMNode();
        box.removeEventListener("track", this.onTrack);
        box.removeEventListener("trackend", this.onTrackEnd);
      } else {
        var label = this.refs.label.getDOMNode();
        label.removeEventListener("track", this.onTrack);
        label.removeEventListener("trackend", this.onTrackEnd);
      }

      this.props.graph.endTransaction('movegroup');
    },
    componentDidUpdate: function (prevProps, prevState) {
      // HACK to change SVG class https://github.com/facebook/react/issues/1139
      var c = "group-box color" + (this.props.color ? this.props.color : 0);
      if (this.props.isSelectionGroup) { 
        c += " selection drag";
      }
      this.refs.box.getDOMNode().setAttribute("class", c);
    },
    render: function() {
      var x = this.props.minX - TheGraph.config.nodeWidth / 2;
      var y = this.props.minY - TheGraph.config.nodeHeight / 2;
      var color = (this.props.color ? this.props.color : 0);

      var boxRectOptions = {
        x: x,
        y: y,
        width: this.props.maxX - this.props.minX + TheGraph.config.nodeWidth * 2,
        height: this.props.maxY - this.props.minY + TheGraph.config.nodeHeight * 2
      };
      boxRectOptions = TheGraph.merge(config.boxRect, boxRectOptions);
      var boxRect =  factories.createGroupBoxRect.call(this, boxRectOptions);

      var labelTextOptions = {
        x: x + TheGraph.config.nodeRadius,
        y: y + 9,
        children: this.props.label
      };
      labelTextOptions = TheGraph.merge(config.labelText, labelTextOptions);
      var labelText = factories.createGroupLabelText.call(this, labelTextOptions);

      var descriptionTextOptions = {
        x: x + TheGraph.config.nodeRadius,
        y: y + 24,
        children: this.props.description
      };
      descriptionTextOptions = TheGraph.merge(config.descriptionText, descriptionTextOptions);
      var descriptionText = factories.createGroupDescriptionText.call(this, descriptionTextOptions);

      var groupContents = [
        boxRect,
        labelText,
        descriptionText
      ];

      return factories.createGroupGroup.call(this, config.container, groupContents);

    }
  });


})(this);