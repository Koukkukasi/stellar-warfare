/**
 * ESLint Plugin: Crash Prevention for Game Development
 *
 * Detects common patterns that cause crashes in real-time games:
 * - Unbounded setInterval/setTimeout without cleanup
 * - requestAnimationFrame loops without cancelAnimationFrame
 * - Missing resource limits (arrays that can grow infinitely)
 * - Missing error boundaries (try-catch in critical loops)
 * - Memory leaks from event listeners
 */

module.exports = {
  meta: {
    name: 'eslint-plugin-stellar-warfare-crash-prevention',
    version: '1.0.0',
  },

  rules: {
    /**
     * Rule: no-unguarded-setinterval
     * Ensures setInterval/setTimeout are wrapped in try-catch and have cleanup
     */
    'no-unguarded-setinterval': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Require setInterval/setTimeout to have error handling and cleanup',
          category: 'Crash Prevention',
          recommended: true,
        },
        messages: {
          noTryCatch: 'setInterval/setTimeout callback must be wrapped in try-catch to prevent crashes',
          noCleanup: 'setInterval/setTimeout must store timer ID for cleanup (e.g., this.timer = setInterval(...))',
        },
      },
      create(context) {
        return {
          CallExpression(node) {
            const callee = node.callee;

            // Check if it's setInterval or setTimeout
            if (
              callee.type === 'Identifier' &&
              (callee.name === 'setInterval' || callee.name === 'setTimeout')
            ) {
              const callback = node.arguments[0];

              // Check if callback has try-catch
              if (callback && callback.type === 'ArrowFunctionExpression' || callback.type === 'FunctionExpression') {
                const body = callback.body;

                // If body is a block statement, check for try-catch
                if (body.type === 'BlockStatement') {
                  const hasTryCatch = body.body.some(
                    statement => statement.type === 'TryStatement'
                  );

                  if (!hasTryCatch) {
                    context.report({
                      node,
                      messageId: 'noTryCatch',
                    });
                  }
                }
              }

              // Check if result is assigned (for cleanup)
              const parent = node.parent;
              const isAssigned =
                parent.type === 'AssignmentExpression' ||
                parent.type === 'VariableDeclarator';

              if (!isAssigned) {
                context.report({
                  node,
                  messageId: 'noCleanup',
                });
              }
            }
          },
        };
      },
    },

    /**
     * Rule: no-unguarded-requestanimationframe
     * Ensures requestAnimationFrame is tracked for cleanup
     */
    'no-unguarded-requestanimationframe': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Require requestAnimationFrame to store ID for cancelAnimationFrame',
          category: 'Crash Prevention',
          recommended: true,
        },
        messages: {
          noCleanup: 'requestAnimationFrame must store frame ID for cleanup (e.g., this.frameId = requestAnimationFrame(...))',
          noCancel: 'Class using requestAnimationFrame must have cancelAnimationFrame in cleanup/destructor',
        },
      },
      create(context) {
        const classesWithRAF = new Set();
        const classesWithCancel = new Set();

        return {
          CallExpression(node) {
            const callee = node.callee;

            // Check if it's requestAnimationFrame
            if (
              callee.type === 'Identifier' &&
              callee.name === 'requestAnimationFrame'
            ) {
              // Check if result is assigned
              const parent = node.parent;
              const isAssigned =
                parent.type === 'AssignmentExpression' ||
                parent.type === 'VariableDeclarator';

              if (!isAssigned) {
                context.report({
                  node,
                  messageId: 'noCleanup',
                });
              }

              // Track which class uses requestAnimationFrame
              const classNode = context.getAncestors().find(
                ancestor => ancestor.type === 'ClassDeclaration'
              );

              if (classNode) {
                classesWithRAF.add(classNode);
              }
            }

            // Check for cancelAnimationFrame
            if (
              callee.type === 'Identifier' &&
              callee.name === 'cancelAnimationFrame'
            ) {
              const classNode = context.getAncestors().find(
                ancestor => ancestor.type === 'ClassDeclaration'
              );

              if (classNode) {
                classesWithCancel.add(classNode);
              }
            }
          },

          'Program:exit'() {
            // Check if all classes with RAF also have cancel
            classesWithRAF.forEach(classNode => {
              if (!classesWithCancel.has(classNode)) {
                context.report({
                  node: classNode,
                  messageId: 'noCancel',
                });
              }
            });
          },
        };
      },
    },

    /**
     * Rule: require-cleanup-handlers
     * Ensures classes with intervals/listeners have cleanup methods
     */
    'require-cleanup-handlers': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Require cleanup methods for classes with intervals/listeners',
          category: 'Crash Prevention',
          recommended: true,
        },
        messages: {
          noCleanup: 'Class with {{resource}} must have cleanup/destroy/stop method',
          noEventRemoval: 'addEventListener must be paired with removeEventListener in cleanup',
        },
      },
      create(context) {
        return {
          ClassDeclaration(node) {
            const className = node.id ? node.id.name : 'Anonymous';
            const methods = node.body.body.filter(
              member => member.type === 'MethodDefinition'
            );

            // Check if class uses setInterval, addEventListener, etc.
            let hasInterval = false;
            let hasListener = false;
            let hasRAF = false;

            methods.forEach(method => {
              const body = method.value.body;

              if (body) {
                // Check for setInterval
                const intervalNodes = context.getSourceCode().ast.tokens.filter(
                  token => token.value === 'setInterval'
                );
                if (intervalNodes.length > 0) hasInterval = true;

                // Check for addEventListener
                const listenerNodes = context.getSourceCode().ast.tokens.filter(
                  token => token.value === 'addEventListener'
                );
                if (listenerNodes.length > 0) hasListener = true;

                // Check for requestAnimationFrame
                const rafNodes = context.getSourceCode().ast.tokens.filter(
                  token => token.value === 'requestAnimationFrame'
                );
                if (rafNodes.length > 0) hasRAF = true;
              }
            });

            // Check if class has cleanup method
            const hasCleanup = methods.some(
              method =>
                method.key.name === 'cleanup' ||
                method.key.name === 'destroy' ||
                method.key.name === 'stop' ||
                method.key.name === 'dispose'
            );

            // Report if missing cleanup
            if ((hasInterval || hasListener || hasRAF) && !hasCleanup) {
              const resources = [];
              if (hasInterval) resources.push('setInterval');
              if (hasListener) resources.push('addEventListener');
              if (hasRAF) resources.push('requestAnimationFrame');

              context.report({
                node,
                messageId: 'noCleanup',
                data: {
                  resource: resources.join(', '),
                },
              });
            }
          },
        };
      },
    },

    /**
     * Rule: require-resource-limits
     * Ensures arrays that can grow have limits
     */
    'require-resource-limits': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Require MAX_* constants for arrays that can grow infinitely',
          category: 'Crash Prevention',
          recommended: true,
        },
        messages: {
          noLimit: 'Array {{name}} can grow infinitely. Add MAX_{{upperName}} limit in constructor',
          checkLimit: 'push() to {{name}} should check MAX_{{upperName}} limit first',
        },
      },
      create(context) {
        const growingArrays = new Map(); // name -> node
        const limits = new Set(); // MAX_* constants found

        return {
          // Track arrays initialized in constructor
          MethodDefinition(node) {
            if (
              node.kind === 'constructor' ||
              (node.key.name === 'constructor')
            ) {
              const body = node.value.body;

              if (body && body.body) {
                body.body.forEach(statement => {
                  // Look for this.arrayName = []
                  if (
                    statement.type === 'ExpressionStatement' &&
                    statement.expression.type === 'AssignmentExpression'
                  ) {
                    const left = statement.expression.left;
                    const right = statement.expression.right;

                    if (
                      left.type === 'MemberExpression' &&
                      left.object.type === 'ThisExpression' &&
                      right.type === 'ArrayExpression'
                    ) {
                      const arrayName = left.property.name;
                      growingArrays.set(arrayName, statement);
                    }
                  }

                  // Look for MAX_* constants
                  if (
                    statement.type === 'ExpressionStatement' &&
                    statement.expression.type === 'AssignmentExpression'
                  ) {
                    const left = statement.expression.left;

                    if (
                      left.type === 'MemberExpression' &&
                      left.object.type === 'ThisExpression' &&
                      left.property.name.startsWith('MAX_')
                    ) {
                      limits.add(left.property.name);
                    }
                  }
                });
              }
            }
          },

          // Check if push() operations check limits
          CallExpression(node) {
            if (
              node.callee.type === 'MemberExpression' &&
              node.callee.property.name === 'push'
            ) {
              const object = node.callee.object;

              if (
                object.type === 'MemberExpression' &&
                object.object.type === 'ThisExpression'
              ) {
                const arrayName = object.property.name;

                if (growingArrays.has(arrayName)) {
                  const upperName = arrayName.toUpperCase();
                  const limitName = `MAX_${upperName}`;

                  // Check if limit exists
                  if (!limits.has(limitName)) {
                    context.report({
                      node: growingArrays.get(arrayName),
                      messageId: 'noLimit',
                      data: { name: arrayName, upperName },
                    });
                  }

                  // Check if push is inside an if statement checking the limit
                  const parent = context.getAncestors().find(
                    ancestor => ancestor.type === 'IfStatement'
                  );

                  if (!parent) {
                    context.report({
                      node,
                      messageId: 'checkLimit',
                      data: { name: arrayName, upperName },
                    });
                  }
                }
              }
            }
          },
        };
      },
    },

    /**
     * Rule: require-error-boundaries
     * Ensures game loops and critical methods have try-catch
     */
    'require-error-boundaries': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Require try-catch in game loops and critical methods',
          category: 'Crash Prevention',
          recommended: true,
        },
        messages: {
          noTryCatch: 'Method {{name}} is critical and must have try-catch error handling',
        },
      },
      create(context) {
        const criticalMethods = [
          'tick', 'update', 'render', 'gameLoop',
          'updatePhysics', 'checkCollisions', 'handleInput',
        ];

        return {
          MethodDefinition(node) {
            const methodName = node.key.name;

            if (criticalMethods.includes(methodName)) {
              const body = node.value.body;

              if (body && body.body) {
                const hasTryCatch = body.body.some(
                  statement => statement.type === 'TryStatement'
                );

                if (!hasTryCatch) {
                  context.report({
                    node,
                    messageId: 'noTryCatch',
                    data: { name: methodName },
                  });
                }
              }
            }
          },
        };
      },
    },
  },
};
