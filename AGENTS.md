# Claude Code Specialized Agents

This repository includes specialized Claude Code agents configured for specific development tasks. All agents are located in `C:/Users/ilmiv/.claude/agents/`.

## Available Agents

### process-manager
**Purpose**: Safe process management and crash prevention
**Tools**: Bash, KillShell, BashOutput
**Key Features**:
- Safe background process termination using KillShell
- Process tracking by shell ID
- Windows-specific command wrapping
- Port conflict detection and resolution
- Background server management with `run_in_background: true`

### dependency-checker
**Purpose**: Automated dependency scanning and security auditing
**Tools**: Read, Bash, Glob, Grep, Write
**Supported Package Managers**: npm, pip, composer, cargo, go mod
**Key Features**:
- Multi-project dependency scanning
- Security vulnerability detection with `npm audit`
- Outdated package identification
- Installation status verification
- Comprehensive dependency reports

### server-specialist
**Purpose**: Backend server development and deployment
**Tools**: Bash, Read, Edit, Write, Glob, Grep
**Expertise**:
- Express.js and Socket.IO server configuration
- Performance optimization (caching, compression, rate limiting)
- Security hardening (CORS, authentication, input validation)
- Database connection pooling
- Production deployment strategies
- Server troubleshooting (CPU, memory, response times)

### game-ux-optimizer
**Purpose**: Game user experience and retention features
**Tools**: All available tools
**Specializations**:
- Kill feed and combat notification systems
- Damage display and floating numbers
- HUD design and status displays
- Progression systems (XP, levels, achievements)
- Daily challenges and reward mechanics
- Tutorial system design and implementation
- Player retention optimization

### ui-design-system-architect
**Purpose**: Visual design system creation and consistency
**Tools**: All available tools
**Capabilities**:
- Design token systems (colors, typography, spacing)
- Animation libraries and effects
- Particle systems and visual effects
- Reusable UI component libraries
- Responsive layout frameworks
- Theme and style guide creation

### code-reviewer
**Purpose**: Comprehensive code quality and security analysis
**Tools**: Read, Glob, Grep, Edit
**Review Categories**:
- **Code Quality**: Readability, maintainability, complexity, error handling
- **Security**: SQL injection, XSS/CSRF, authentication, secrets management
- **Performance**: Algorithm efficiency, database queries, caching, memory leaks
- **Best Practices**: Architecture patterns, TypeScript usage, framework-specific patterns
- **Modern Standards**: ES6+, async/await, module systems

### game-level-designer
**Purpose**: Game level design, balancing, and progression systems
**Tools**: Read, Write, Edit, Glob, Grep, Bash
**Specializations**:
- **Level Design**: Spatial layout, flow, player guidance, replayability
- **Difficulty Curves**: Progressive challenge scaling, pacing, balance
- **Genre Expertise**: Platformers, action/combat, puzzles, space combat, multiplayer arenas
- **Procedural Generation**: Wave systems, random maps, dynamic difficulty
- **Boss Design**: Arena layout, attack patterns, phase transitions
- **Tutorial Levels**: Progressive teaching, skill introduction, onboarding
- **Balancing Tools**: Difficulty calculators, metrics tracking, playtesting frameworks

### game-graphics-designer
**Purpose**: Visual asset creation for games (sprites, animations, UI, effects)
**Tools**: Read, Write, Edit, Glob, Grep, Bash
**Specializations**:
- **Art Styles**: Pixel art, vector graphics, 2D hand-drawn, 3D rendered 2D
- **Sprite Design**: Characters, vehicles, environments, animations
- **Particle Effects**: Explosions, trails, power-ups, environmental effects
- **UI/UX Graphics**: Buttons, icons, HUD elements, menus
- **Canvas Graphics**: HTML5 Canvas drawing, procedural generation
- **SVG Graphics**: Scalable vector assets, filters, gradients
- **Animation**: Sprite sheets, frame-by-frame, timing and easing
- **Optimization**: File size reduction, sprite atlases, performance budgets
- **Color Theory**: Palettes, accessibility, visual cohesion

### fact-checker
**Purpose**: Verification and validation of technical claims and information
**Tools**: Read, WebFetch, WebSearch, Grep, Glob, Bash
**Specializations**:
- **Technical Verification**: API documentation, library capabilities, version compatibility
- **Code Validation**: Syntax checking, logical correctness, best practices
- **Documentation Cross-Reference**: Official docs, authoritative sources
- **Performance Claims**: Benchmark verification, measurement validation
- **Security Verification**: Best practices validation, vulnerability checking
- **Source Reliability**: Rating confidence levels, identifying red flags
- **Fact-Check Reports**: Structured verification with sources and evidence
- **Multi-Source Validation**: Cross-referencing independent sources

## Using Agents

Agents are automatically available and can be invoked by Claude Code when appropriate for the task. To explicitly request an agent:
- "Use the server-specialist agent to optimize the Express server"
- "Run the code-reviewer agent on the Nordic Football Betting codebase"
- "Use dependency-checker to scan all projects for vulnerabilities"
- "Use game-level-designer to create a new multiplayer map"
- "Use game-graphics-designer to create ship sprites and UI elements"
- "Use fact-checker to verify that Socket.IO supports automatic reconnection"

## Agent Configuration

Each agent is defined in a JSON file with the following structure:
```json
{
  "name": "agent-name",
  "description": "Brief description of agent's purpose",
  "tools": ["Tool1", "Tool2"],
  "instructions": "Detailed instructions for the agent..."
}
```

## Created Date
2025-10-03

## Projects Using Agents
- **Stellar Warfare**: game-ux-optimizer, ui-design-system-architect, server-specialist, code-reviewer, game-level-designer, game-graphics-designer, fact-checker
- **Nordic Football Betting**: dependency-checker, code-reviewer, fact-checker
- **All Game Projects**: game-level-designer, game-ux-optimizer, game-graphics-designer
- **All Projects**: process-manager, dependency-checker, fact-checker
