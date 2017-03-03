import { StyleSheet, View, AppRegistry } from 'react-native';
import React, { Component } from 'react';
import StaticContainer from 'react-native/Libraries/Components/StaticContainer';
import EventEmitter from 'react-native/Libraries/EventEmitter/EventEmitter';

const styles = StyleSheet.create({
    container: {
        flex: 1,
        position: 'relative'
    }
});

const emitter = new EventEmitter();
const stack = [];

// inject modals into app entry component
const originRegister = AppRegistry.registerComponent;

AppRegistry.registerComponent = function (appKey, getAppComponent) {

    return originRegister(appKey, function () {
        const siblings = new Map();
        const updates = new Set();
        const OriginAppComponent = getAppComponent();

        return class extends Component {
            static displayName = `Root(${appKey})`;
            
            componentWillMount() {
                this._update = this._update.bind(this);
                stack.push(this);
                emitter.addListener('siblings.update', this._update);
            };

            componentWillUnmount() {
                var index = stack.indexOf(this);
                if (index != -1) stack.splice(index, 1);
                emitter.removeListener('siblings.update', this._update);
            };

            _update(id, element, callback) {
                if(stack[stack.length-1] != this) return;
                if (siblings.has(id) && !element) {
                    siblings.delete(id);
                } else {
                    siblings.set(id, element);
                }
                updates.add(id);
                this.forceUpdate(callback);
            };

            render() {
                const elements = [];
                const pendingClear = [];
                siblings.forEach((element, id) => {
                    elements.push(
                        <StaticContainer
                            key={`root-sibling-${id}`}
                            shouldUpdate={updates.has(id)}
                        >
                            {element}
                        </StaticContainer>
                    );
                    if(!element) pendingClear.push(id);
                });
                for (let i = 0; i < pendingClear.length; i++) {
                    siblings.delete(pendingClear[i]);
                }
                console.log(siblings);
                updates.clear();

                return (
                    <View style={styles.container}>
                        <StaticContainer shouldUpdate={false}>
                            <OriginAppComponent {...this.props} />
                        </StaticContainer>
                        {elements}
                    </View>
                );
            };
        };
    });
};

export default emitter;
