import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { 
  Brain, 
  GitBranch, 
  Zap, 
  Terminal, 
  ShieldAlert, 
  AlertTriangle, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Filter, 
  Maximize2, 
  ChevronRight, 
  X,
  Sparkles, 
  Cpu, 
  Layers,
  FileText,
  Key
} from 'lucide-react';
import Markdown from 'react-markdown';
import { ReasoningStep, ReasoningResult, DiscoveryNode } from '../services/reasoningEngine';
import { ReasoningFlawCheck } from '../types';

export interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  label: string;
  type: 'stage' | 'concept' | 'evidence' | 'hypothesis' | 'logic' | 'branch' | 'thought' | 'code' | 'flaw' | 'assumption';
  stage?: string;
  stepIndex?: number;
  content?: string;
  thought?: string;
  codeExecution?: { code: string; output: string };
  evidence?: string;
  flawsFound?: ReasoningFlawCheck[];
  model?: string;
  temperature?: number;
  timestamp?: number;
  radius: number;
  color: string;
  subLabel?: string;
  stepRef?: ReasoningStep;
}

export interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  source: string | GraphNode;
  target: string | GraphNode;
  type: 'flow' | 'discovery' | 'thought' | 'code' | 'flaw' | 'assumption';
  label?: string;
}

interface ReasoningDependencyGraphProps {
  steps: ReasoningStep[];
  result?: ReasoningResult | null;
  onSelectStep?: (step: ReasoningStep) => void;
  className?: string;
}

export const ReasoningDependencyGraph: React.FC<ReasoningDependencyGraphProps> = ({
  steps,
  result,
  onSelectStep,
  className = ''
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [layoutMode, setLayoutMode] = useState<'force' | 'hierarchical'>('force');
  const [showDiscoveryNodes, setShowDiscoveryNodes] = useState(true);
  const [showAuxNodes, setShowAuxNodes] = useState(true); // thoughts, code, flaws
  const [showFlawsOnly, setShowFlawsOnly] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [zoomLevel, setZoomLevel] = useState(1);

  // D3 zoom transform reference
  const zoomBehaviorRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const gRef = useRef<SVGGElement | null>(null);

  // Build graph nodes and links from steps & result
  const { nodes, links } = useMemo(() => {
    const nodeList: GraphNode[] = [];
    const linkList: GraphLink[] = [];

    if (!steps || steps.length === 0) {
      return { nodes: [], links: [] };
    }

    steps.forEach((step, idx) => {
      const stepNodeId = `step-${idx}`;
      
      // Determine stage color
      let color = '#10b981'; // default emerald
      const stageLower = step.stage.toLowerCase();
      if (stageLower.includes('classifier') || stageLower.includes('intent')) color = '#6366f1'; // indigo
      else if (stageLower.includes('skeleton') || stageLower.includes('mapper')) color = '#a855f7'; // purple
      else if (stageLower.includes('solver') || stageLower.includes('reasoning') || stageLower.includes('cot')) color = '#06b6d4'; // cyan
      else if (stageLower.includes('verifier') || stageLower.includes('critic')) color = '#f59e0b'; // amber
      else if (stageLower.includes('finalizer')) color = '#10b981'; // emerald
      else if (stageLower.includes('assumption')) color = '#8b5cf6'; // violet

      // Main Step Node
      const stepNode: GraphNode = {
        id: stepNodeId,
        label: `[${step.stage.toUpperCase()}]`,
        type: 'stage',
        stage: step.stage,
        stepIndex: idx,
        content: step.content,
        thought: step.thought,
        codeExecution: step.codeExecution,
        evidence: step.evidence,
        flawsFound: step.flawsFound,
        model: step.model,
        temperature: step.temperature,
        timestamp: step.timestamp,
        radius: 26,
        color,
        subLabel: step.model ? `${step.model}` : undefined,
        stepRef: step
      };
      nodeList.push(stepNode);

      // Sequential flow link between steps
      if (idx > 0) {
        linkList.push({
          source: `step-${idx - 1}`,
          target: stepNodeId,
          type: 'flow',
          label: 'next'
        });
      }

      // Add attached Thought Node if present & enabled
      if (step.thought && showAuxNodes) {
        const thoughtNodeId = `thought-${idx}`;
        nodeList.push({
          id: thoughtNodeId,
          label: 'Cognitive Thinking Trace',
          type: 'thought',
          stage: step.stage,
          stepIndex: idx,
          content: step.thought,
          radius: 18,
          color: '#3b82f6', // blue
          subLabel: 'Gemini Internal CoT',
          stepRef: step
        });
        linkList.push({
          source: stepNodeId,
          target: thoughtNodeId,
          type: 'thought',
          label: 'thinks'
        });
      }

      // Add attached Code Execution Node if present & enabled
      if (step.codeExecution && showAuxNodes) {
        const codeNodeId = `code-${idx}`;
        nodeList.push({
          id: codeNodeId,
          label: 'Python Sandbox Code',
          type: 'code',
          stage: step.stage,
          stepIndex: idx,
          content: step.codeExecution.code,
          codeExecution: step.codeExecution,
          radius: 18,
          color: '#f59e0b', // amber
          subLabel: 'Code Execution',
          stepRef: step
        });
        linkList.push({
          source: stepNodeId,
          target: codeNodeId,
          type: 'code',
          label: 'executes'
        });
      }

      // Add attached Flaw Nodes if present & enabled
      if (step.flawsFound && step.flawsFound.length > 0 && showAuxNodes) {
        step.flawsFound.forEach((flaw, fIdx) => {
          const flawNodeId = `flaw-${idx}-${fIdx}`;
          nodeList.push({
            id: flawNodeId,
            label: flaw.name,
            type: 'flaw',
            stage: step.stage,
            stepIndex: idx,
            content: flaw.evidence,
            radius: 16,
            color: '#f43f5e', // rose
            subLabel: `Bias Audit (${flaw.severity})`,
            stepRef: step
          });
          linkList.push({
            source: stepNodeId,
            target: flawNodeId,
            type: 'flaw',
            label: 'flagged'
          });
        });
      }

      // Add Discovered Nodes parsed or attached
      if (showDiscoveryNodes) {
        const nodesToAdd: DiscoveryNode[] = step.discoveryNodes || [];

        // Auto-generate evidence node if evidence block present but no explicit discovery nodes
        if (step.evidence && nodesToAdd.length === 0) {
          nodesToAdd.push({
            id: `ev-${idx}`,
            label: 'Formal Evidence Target',
            type: 'evidence',
            description: step.evidence
          });
        }

        nodesToAdd.forEach((dn, dnIdx) => {
          const dnId = dn.id || `dn-${idx}-${dnIdx}`;
          let dnColor = '#22d3ee'; // cyan for concept
          if (dn.type === 'evidence') dnColor = '#10b981';
          else if (dn.type === 'hypothesis') dnColor = '#a855f7';
          else if (dn.type === 'logic') dnColor = '#6366f1';
          else if (dn.type === 'branch') dnColor = '#f59e0b';

          nodeList.push({
            id: dnId,
            label: dn.label,
            type: dn.type,
            stage: step.stage,
            stepIndex: idx,
            content: dn.description || dn.label,
            radius: 16,
            color: dnColor,
            subLabel: dn.type.toUpperCase(),
            stepRef: step
          });

          // Link to parent or to stepNode
          const sourceId = dn.parentId && nodeList.some(n => n.id === dn.parentId) ? dn.parentId : stepNodeId;
          linkList.push({
            source: sourceId,
            target: dnId,
            type: 'discovery',
            label: dn.type
          });
        });
      }
    });

    // Add Assumptions nodes from result if present
    if (result?.assumptionsAnalysis?.assumptions && showDiscoveryNodes) {
      result.assumptionsAnalysis.assumptions.slice(0, 4).forEach((ass, aIdx) => {
        const assId = `ass-${aIdx}`;
        nodeList.push({
          id: assId,
          label: ass.statement.length > 30 ? ass.statement.slice(0, 28) + '...' : ass.statement,
          type: 'assumption',
          stage: 'Assumption Validation',
          content: `${ass.statement}\n\nCategory: ${ass.category} (${ass.type})\nJustification: ${ass.justification}`,
          radius: 15,
          color: '#8b5cf6',
          subLabel: `Assumption (${ass.category})`
        });

        // Link to assumption step or last step
        const lastStepId = `step-${steps.length - 1}`;
        linkList.push({
          source: lastStepId,
          target: assId,
          type: 'assumption',
          label: 'assumes'
        });
      });
    }

    // Filter nodes by search or flaw view if active
    let filteredNodes = nodeList;
    if (showFlawsOnly) {
      const flawNodeIds = new Set(nodeList.filter(n => n.type === 'flaw' || (n.flawsFound && n.flawsFound.length > 0)).map(n => n.id));
      filteredNodes = nodeList.filter(n => flawNodeIds.has(n.id));
    }
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filteredNodes = filteredNodes.filter(n => 
        n.label.toLowerCase().includes(term) || 
        (n.stage && n.stage.toLowerCase().includes(term)) ||
        (n.content && n.content.toLowerCase().includes(term))
      );
    }

    const filteredNodeIds = new Set(filteredNodes.map(n => n.id));
    const filteredLinks = linkList.filter(l => {
      const sId = typeof l.source === 'string' ? l.source : (l.source as any).id;
      const tId = typeof l.target === 'string' ? l.target : (l.target as any).id;
      return filteredNodeIds.has(sId) && filteredNodeIds.has(tId);
    });

    return { nodes: filteredNodes, links: filteredLinks };
  }, [steps, result, showDiscoveryNodes, showAuxNodes, showFlawsOnly, searchTerm]);

  // Main D3 Rendering Effect
  useEffect(() => {
    if (!svgRef.current || !containerRef.current || nodes.length === 0) return;

    const width = containerRef.current.clientWidth || 800;
    const height = containerRef.current.clientHeight || 500;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // Clear previous rendering

    // Create SVG defs for gradients and marker arrowheads
    const defs = svg.append('defs');

    // Arrowhead marker for directed edges
    defs.append('marker')
      .attr('id', 'arrow')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 22)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#10b981')
      .attr('opacity', 0.8);

    defs.append('marker')
      .attr('id', 'arrow-sub')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 18)
      .attr('refY', 0)
      .attr('markerWidth', 5)
      .attr('markerHeight', 5)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#64748b')
      .attr('opacity', 0.6);

    // Filter glow effect
    const filter = defs.append('filter')
      .attr('id', 'glow')
      .attr('x', '-20%')
      .attr('y', '-20%')
      .attr('width', '140%')
      .attr('height', '140%');
    
    filter.append('feGaussianBlur')
      .attr('stdDeviation', '4')
      .attr('result', 'coloredBlur');
    
    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    // Container group for pan/zoom
    const g = svg.append('g').attr('class', 'graph-container');
    gRef.current = g.node();

    // Setup D3 Zoom
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.2, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
        setZoomLevel(event.transform.k);
      });

    zoomBehaviorRef.current = zoom;
    svg.call(zoom);

    // Prepare simulation nodes & links (deep copy to avoid mutation conflicts)
    const simNodes: GraphNode[] = nodes.map(n => ({ ...n }));
    const simLinks: GraphLink[] = links.map(l => ({ ...l }));

    let simulation: d3.Simulation<GraphNode, GraphLink>;

    if (layoutMode === 'hierarchical') {
      // Position nodes in horizontal ranks by step index
      const stepSpacing = Math.min(180, width / (steps.length + 1));
      simNodes.forEach(n => {
        if (n.stepIndex !== undefined) {
          n.fx = (n.stepIndex + 1) * stepSpacing;
          if (n.type === 'stage') {
            n.fy = height / 2;
          } else {
            // Offset subnodes vertically
            const hash = (n.id.charCodeAt(n.id.length - 1) % 5) - 2;
            n.fy = height / 2 + hash * 60 + (n.type === 'thought' ? -100 : n.type === 'code' ? 100 : 70);
          }
        }
      });

      simulation = d3.forceSimulation<GraphNode, GraphLink>(simNodes)
        .force('link', d3.forceLink<GraphNode, GraphLink>(simLinks).id(d => d.id).distance(80))
        .force('collide', d3.forceCollide<GraphNode>(d => d.radius + 12));
    } else {
      // Force Directed Simulation
      simulation = d3.forceSimulation<GraphNode, GraphLink>(simNodes)
        .force('link', d3.forceLink<GraphNode, GraphLink>(simLinks)
          .id(d => d.id)
          .distance(d => d.type === 'flow' ? 140 : 80)
        )
        .force('charge', d3.forceManyBody().strength(-380))
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force('collide', d3.forceCollide<GraphNode>(d => d.radius + 16))
        .force('y', d3.forceY<GraphNode>(d => {
          if (d.stepIndex !== undefined) {
            return (d.stepIndex / Math.max(1, steps.length - 1)) * (height - 120) + 60;
          }
          return height / 2;
        }).strength(0.25));
    }

    // Render Links
    const linkGroup = g.append('g').attr('class', 'links');
    const linkElements = linkGroup.selectAll<SVGPathElement, GraphLink>('path')
      .data(simLinks)
      .enter()
      .append('path')
      .attr('stroke', d => d.type === 'flow' ? '#10b981' : d.type === 'flaw' ? '#f43f5e' : d.type === 'thought' ? '#3b82f6' : '#475569')
      .attr('stroke-width', d => d.type === 'flow' ? 2.5 : 1.5)
      .attr('stroke-dasharray', d => d.type === 'discovery' || d.type === 'flaw' ? '4,4' : 'none')
      .attr('opacity', d => d.type === 'flow' ? 0.8 : 0.6)
      .attr('fill', 'none')
      .attr('marker-end', d => d.type === 'flow' ? 'url(#arrow)' : 'url(#arrow-sub)');

    // Render Nodes
    const nodeGroup = g.append('g').attr('class', 'nodes');
    const nodeElements = nodeGroup.selectAll<SVGGElement, GraphNode>('g')
      .data(simNodes)
      .enter()
      .append('g')
      .attr('class', 'node-group cursor-pointer')
      .call(d3.drag<SVGGElement, GraphNode>()
        .on('start', (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on('drag', (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on('end', (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          if (layoutMode !== 'hierarchical') {
            d.fx = null;
            d.fy = null;
          }
        })
      )
      .on('click', (_event, d) => {
        setSelectedNode(d);
        if (d.stepRef && onSelectStep) {
          onSelectStep(d.stepRef);
        }
      });

    // Outer aura ring for stage nodes or active selected node
    nodeElements.append('circle')
      .attr('r', d => d.radius + 4)
      .attr('fill', 'none')
      .attr('stroke', d => d.color)
      .attr('stroke-width', d => d.type === 'stage' ? 2 : 1)
      .attr('opacity', 0.4)
      .attr('filter', d => d.type === 'stage' ? 'url(#glow)' : 'none');

    // Main circle background
    nodeElements.append('circle')
      .attr('r', d => d.radius)
      .attr('fill', '#09090b')
      .attr('stroke', d => d.color)
      .attr('stroke-width', 2);

    // Inner icon or text badge
    nodeElements.append('text')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .attr('fill', d => d.color)
      .attr('font-size', d => d.type === 'stage' ? '11px' : '9px')
      .attr('font-family', 'monospace')
      .attr('font-weight', 'bold')
      .text(d => {
        if (d.type === 'stage') return d.stage ? d.stage.slice(0, 3).toUpperCase() : 'STG';
        if (d.type === 'thought') return 'THK';
        if (d.type === 'code') return 'PY';
        if (d.type === 'flaw') return 'FLW';
        if (d.type === 'evidence') return 'EVI';
        return d.type.slice(0, 3).toUpperCase();
      });

    // Node Label underneath
    nodeElements.append('text')
      .attr('y', d => d.radius + 14)
      .attr('text-anchor', 'middle')
      .attr('fill', '#e2e8f0')
      .attr('font-size', '10px')
      .attr('font-family', 'sans-serif')
      .attr('font-weight', '600')
      .text(d => d.label.length > 20 ? d.label.slice(0, 18) + '...' : d.label);

    // Sub-label (model, type, severity)
    nodeElements.append('text')
      .attr('y', d => d.radius + 25)
      .attr('text-anchor', 'middle')
      .attr('fill', '#64748b')
      .attr('font-size', '8px')
      .attr('font-family', 'monospace')
      .text(d => d.subLabel || '');

    // Simulation Tick Update
    simulation.on('tick', () => {
      linkElements.attr('d', d => {
        const source = d.source as GraphNode;
        const target = d.target as GraphNode;
        if (!source.x || !source.y || !target.x || !target.y) return '';

        // Curved paths for secondary nodes, straight for stage flow
        if (d.type === 'flow') {
          return `M${source.x},${source.y} L${target.x},${target.y}`;
        }
        const dx = target.x - source.x;
        const dy = target.y - source.y;
        const dr = Math.sqrt(dx * dx + dy * dy) * 1.2;
        return `M${source.x},${source.y}A${dr},${dr} 0 0,1 ${target.x},${target.y}`;
      });

      nodeElements.attr('transform', d => `translate(${d.x || 0},${d.y || 0})`);
    });

    return () => {
      simulation.stop();
    };
  }, [nodes, links, layoutMode, steps.length, onSelectStep]);

  // Zoom controls
  const handleZoomIn = () => {
    if (svgRef.current && zoomBehaviorRef.current) {
      d3.select(svgRef.current).transition().duration(300).call(zoomBehaviorRef.current.scaleBy, 1.3);
    }
  };

  const handleZoomOut = () => {
    if (svgRef.current && zoomBehaviorRef.current) {
      d3.select(svgRef.current).transition().duration(300).call(zoomBehaviorRef.current.scaleBy, 0.7);
    }
  };

  const handleResetZoom = () => {
    if (svgRef.current && zoomBehaviorRef.current) {
      d3.select(svgRef.current).transition().duration(400).call(zoomBehaviorRef.current.transform, d3.zoomIdentity);
    }
  };

  return (
    <div className={`flex flex-col h-full bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden ${className}`}>
      
      {/* Top Toolbar */}
      <div className="p-3 bg-zinc-900/90 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <GitBranch className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-white tracking-tight">Trace Logic Dependency Graph</span>
            <span className="ml-2 text-[10px] text-zinc-400">D3 System 2 Cognitive Flow</span>
          </div>
        </div>

        {/* View Controls & Toggles */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Layout Mode Switcher */}
          <div className="flex bg-zinc-950 p-0.5 rounded-lg border border-zinc-800">
            <button
              onClick={() => setLayoutMode('force')}
              className={`px-2.5 py-1 text-[10px] rounded font-bold transition-colors ${layoutMode === 'force' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'text-zinc-400 hover:text-white'}`}
            >
              Force Directed
            </button>
            <button
              onClick={() => setLayoutMode('hierarchical')}
              className={`px-2.5 py-1 text-[10px] rounded font-bold transition-colors ${layoutMode === 'hierarchical' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'text-zinc-400 hover:text-white'}`}
            >
              Pipeline Rank
            </button>
          </div>

          {/* Node Filter Toggles */}
          <button
            onClick={() => setShowDiscoveryNodes(!showDiscoveryNodes)}
            className={`px-2 py-1 text-[10px] rounded border transition-colors flex items-center gap-1 ${showDiscoveryNodes ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30' : 'bg-zinc-900 text-zinc-500 border-zinc-800'}`}
          >
            <Sparkles className="w-3 h-3" />
            <span>Discovery Nodes</span>
          </button>

          <button
            onClick={() => setShowAuxNodes(!showAuxNodes)}
            className={`px-2 py-1 text-[10px] rounded border transition-colors flex items-center gap-1 ${showAuxNodes ? 'bg-blue-500/10 text-blue-300 border-blue-500/30' : 'bg-zinc-900 text-zinc-500 border-zinc-800'}`}
          >
            <Brain className="w-3 h-3" />
            <span>Thinking & Code</span>
          </button>

          <button
            onClick={() => setShowFlawsOnly(!showFlawsOnly)}
            className={`px-2 py-1 text-[10px] rounded border transition-colors flex items-center gap-1 ${showFlawsOnly ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 font-bold' : 'bg-zinc-900 text-zinc-500 border-zinc-800'}`}
          >
            <AlertTriangle className="w-3 h-3 text-rose-400" />
            <span>Flaws Only</span>
          </button>

          {/* Search Filter */}
          <input
            type="text"
            placeholder="Search nodes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-2 py-1 text-[10px] bg-zinc-950 border border-zinc-800 rounded text-zinc-200 outline-none focus:border-emerald-500/50 w-28"
          />

          {/* Zoom Buttons */}
          <div className="flex items-center bg-zinc-950 rounded border border-zinc-800">
            <button onClick={handleZoomIn} className="p-1 hover:text-emerald-400 text-zinc-400 border-r border-zinc-800" title="Zoom In">
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button onClick={handleZoomOut} className="p-1 hover:text-emerald-400 text-zinc-400 border-r border-zinc-800" title="Zoom Out">
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button onClick={handleResetZoom} className="p-1 hover:text-emerald-400 text-zinc-400" title="Reset View">
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="relative flex-1 bg-zinc-950 overflow-hidden" ref={containerRef}>
        {nodes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-zinc-600 font-mono text-xs">
            <Brain className="w-8 h-8 mb-2 opacity-40 animate-pulse" />
            <span>No reasoning steps recorded in trace graph</span>
          </div>
        ) : (
          <svg
            ref={svgRef}
            className="w-full h-full cursor-grab active:cursor-grabbing"
            style={{ minHeight: '400px' }}
          />
        )}

        {/* Floating Legend */}
        <div className="absolute bottom-3 left-3 bg-zinc-900/90 border border-zinc-800/80 p-2.5 rounded-xl font-mono text-[9px] text-zinc-300 space-y-1.5 backdrop-blur-md shadow-lg pointer-events-none">
          <div className="font-bold text-zinc-400 uppercase tracking-wider text-[8px]">Graph Legend</div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-indigo-500" />
              <span>Classifier / Intent</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-cyan-500" />
              <span>Solver Node</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>Verifier / Code</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <span>CoT Thought</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span>Fallacy / Bias Flag</span>
            </div>
          </div>
        </div>

        {/* Selected Node Inspector Drawer */}
        {selectedNode && (
          <div className="absolute top-3 right-3 bottom-3 w-80 max-w-full bg-zinc-900/95 border border-zinc-800 rounded-xl p-4 shadow-2xl flex flex-col font-mono text-xs z-30 backdrop-blur-md overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: selectedNode.color }} />
                <span className="font-bold text-white truncate max-w-[180px]">{selectedNode.label}</span>
              </div>
              <button
                onClick={() => setSelectedNode(null)}
                className="p-1 text-zinc-400 hover:text-white rounded bg-zinc-800/50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-3 space-y-3 font-sans text-xs text-zinc-300">
              <div>
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block mb-1">Stage / Type</span>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-zinc-800 text-emerald-400 uppercase">
                    {selectedNode.stage || selectedNode.type}
                  </span>
                  {selectedNode.model && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                      {selectedNode.model}
                    </span>
                  )}
                </div>
              </div>

              {selectedNode.content && (
                <div>
                  <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block mb-1">Node Output Payload</span>
                  <div className="bg-black/60 p-3 rounded-lg border border-zinc-800/80 text-[11px] font-sans leading-relaxed text-zinc-200 overflow-x-auto max-h-48 overflow-y-auto">
                    <Markdown>{selectedNode.content}</Markdown>
                  </div>
                </div>
              )}

              {selectedNode.codeExecution && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-mono text-amber-400 uppercase tracking-widest block">Python Sandbox Execution</span>
                  <div className="bg-black/80 p-2.5 rounded font-mono text-[10px] text-amber-200 border border-amber-500/20 overflow-x-auto">
                    {selectedNode.codeExecution.code}
                  </div>
                  <div className="bg-zinc-950 p-2 rounded text-[10px] font-mono text-emerald-400 border border-zinc-800">
                    <strong>Stdout:</strong> {selectedNode.codeExecution.output}
                  </div>
                </div>
              )}

              {selectedNode.flawsFound && selectedNode.flawsFound.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-mono text-rose-400 uppercase tracking-widest block">Fallacy Audit Flags</span>
                  {selectedNode.flawsFound.map((flaw, fIdx) => (
                    <div key={fIdx} className="p-2 bg-rose-500/10 border border-rose-500/20 rounded text-[10px] space-y-1">
                      <div className="font-bold text-rose-300">{flaw.name} ({flaw.severity})</div>
                      <p className="text-zinc-300">{flaw.evidence}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-zinc-800 flex justify-end">
              {selectedNode.stepRef && onSelectStep && (
                <button
                  onClick={() => onSelectStep(selectedNode.stepRef!)}
                  className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 rounded text-xs font-mono font-bold flex items-center gap-1"
                >
                  <span>Inspect Full Step</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
