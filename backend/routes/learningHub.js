const express = require('express');
const router = express.Router();
const https = require('https');
const { authenticateToken } = require('../middleware/auth');
const db = require('../config/db');

// Helper for ultra-fast Groq LLM inference for concept explanation
async function callGroqExplain(conceptName, subject) {
    const key = process.env.GROQ_API_KEY;
    if (!key || key.length < 10) return null;
    return new Promise((resolve) => {
        const body = JSON.stringify({
            model: 'qwen/qwen3.8-27b',
            messages: [
                {
                    role: 'system',
                    content: `You are an expert computer science tutor. Explain the concept "${conceptName}" from the subject "${subject}" in 2-3 simple, beginner-friendly sentences. Include a short 1-line real-world or technical example. Avoid markdown asterisks/bullets so it is clean.`
                },
                {
                    role: 'user',
                    content: `Explain ${conceptName} simply.`
                }
            ],
            max_tokens: 200,
            temperature: 0.5
        });

        const req = https.request({
            hostname: 'api.groq.com',
            port: 443,
            path: '/openai/v1/chat/completions',
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + key,
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(body)
            },
            timeout: 4000
        }, res => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    const content = json.choices?.[0]?.message?.content;
                    resolve(content ? content.trim() : null);
                } catch {
                    resolve(null);
                }
            });
        });

        req.on('error', () => resolve(null));
        req.on('timeout', () => { req.destroy(); resolve(null); });
        req.write(body);
        req.end();
    });
}

// Curated Verified Subject Catalog
const LEARNING_RESOURCES = [
    {
        id: 'dsa',
        subject: 'Data Structures & Algorithms',
        shortName: 'DSA',
        description: 'Fundamental data organization techniques and computational problem-solving algorithms.',
        interactiveTool: {
            name: 'VisuAlgo',
            title: 'Interactive DSA Visualizer',
            description: 'Visualize data structures and algorithms through interactive real-time animations.',
            url: 'https://visualgo.net/en',
            badge: 'Interactive Visualizer',
            topics: [
                'Array & Sorting',
                'Linked List',
                'Stack & Queue',
                'Binary Heap',
                'Hash Table',
                'Binary Search Tree',
                'Graph Traversal (BFS/DFS)',
                'Prim & Kruskal MST',
                'Dijkstra Shortest Path',
                'Dynamic Programming Trees'
            ]
        },
        books: [
            {
                id: 'clrs-algo',
                title: 'Introduction to Algorithms (4th Edition)',
                authors: 'Thomas H. Cormen, Charles E. Leiserson, Ronald L. Rivest, Clifford Stein',
                publisher: 'MIT Press',
                edition: '4th Edition',
                verifiedUrl: 'https://mitpress.mit.edu/9780262046305/introduction-to-algorithms/',
                conceptsCovered: ['Arrays', 'Linked Lists', 'Stacks & Queues', 'Trees', 'Graphs', 'Sorting Algorithms', 'Searching', 'Dynamic Programming', 'Greedy Algorithms']
            },
            {
                id: 'karumanchi-dsa',
                title: 'Data Structures and Algorithms Made Easy',
                authors: 'Narasimha Karumanchi',
                publisher: 'CareerMonk Publications',
                edition: '5th Edition',
                verifiedUrl: 'https://www.careermonk.com/',
                conceptsCovered: ['Arrays & Strings', 'Linked Lists', 'Stacks & Queues', 'Trees & BST', 'Graphs', 'Recursion & Backtracking', 'Sorting & Searching', 'Hashing']
            }
        ],
        concepts: [
            {
                name: 'Binary Search',
                definition: 'Search a sorted array by repeatedly dividing the search interval in half.',
                example: 'Looking up a name in an alphabetical phone directory in O(log n) time.',
                usedIn: ['Database indexing', 'Range queries', 'Root finding algorithms']
            },
            {
                name: 'Stack',
                definition: 'A linear data structure that follows the Last In, First Out (LIFO) order of operations.',
                example: 'Browser back-button history or a plate stack where the last placed item is removed first.',
                usedIn: ['Function call execution stack', 'Undo/Redo mechanisms', 'Expression parsing']
            },
            {
                name: 'Queue',
                definition: 'A linear data structure following First In, First Out (FIFO) where insertion occurs at the rear and deletion at the front.',
                example: 'A real-world ticket counter line where the first customer is served first.',
                usedIn: ['CPU task scheduling', 'Print job spooling', 'Breadth-First Search (BFS)']
            },
            {
                name: 'Linked List',
                definition: 'A linear sequence of data nodes where each node points to the next node via pointers rather than contiguous memory.',
                example: 'A music playlist where each track contains a pointer to the next track.',
                usedIn: ['Dynamic memory allocation', 'Hash table chaining', 'Graph adjacency lists']
            },
            {
                name: 'Binary Tree & BST',
                definition: 'A hierarchical tree data structure where each node has at most two children, and BST maintains left < parent < right.',
                example: 'File system hierarchies and decision trees.',
                usedIn: ['Efficient searching & sorting', 'Auto-complete dictionaries', 'Routing tables']
            },
            {
                name: 'Binary Heap & Priority Queue',
                definition: 'A complete binary tree satisfying the heap property where parent is always greater (Max-Heap) or smaller (Min-Heap) than children.',
                example: 'Hospital emergency room triage prioritizing critical patients first.',
                usedIn: ['Dijkstra shortest path algorithm', 'Heap sort', 'Operating system priority schedulers']
            },
            {
                name: 'Hash Table',
                definition: 'A data structure that maps keys to values using a mathematical hash function for average O(1) time lookups.',
                example: 'A dictionary book where index lookup instantly navigates to the word definition.',
                usedIn: ['Database indexing', 'Caches (Redis/Memcached)', 'Compiler symbol tables']
            },
            {
                name: 'Dynamic Programming',
                definition: 'A method for solving complex optimization problems by breaking them into overlapping subproblems and memoizing intermediate results.',
                example: 'Computing Fibonacci numbers where F(n) reuses already computed F(n-1) and F(n-2).',
                usedIn: ['Shortest paths in networks', 'Knapsack problem', 'DNA sequence alignment']
            },
            {
                name: 'Graph Traversal (BFS & DFS)',
                definition: 'Algorithms for visiting all vertices in a network; BFS explores level-by-level using queues, while DFS explores depth-first using recursion/stacks.',
                example: 'Finding the shortest connection path between two friends on social networks.',
                usedIn: ['GPS navigation route calculation', 'Web crawling', 'Circuit wire routing']
            }
        ]
    },
    {
        id: 'de',
        subject: 'Digital Electronics',
        shortName: 'Digital Electronics',
        description: 'Design and analysis of digital logic systems, combinational and sequential hardware circuits.',
        interactiveTool: {
            name: 'EveryCircuit',
            title: 'Digital Circuit Simulator',
            description: 'Build, animate, and simulate logic gates, flip-flops, counters, and digital circuits interactively in real time.',
            url: 'https://everycircuit.com/',
            badge: 'Interactive Circuit Simulator',
            topics: [
                'Logic Gates (AND, OR, NOT)',
                'Universal Gates (NAND, NOR)',
                'Exclusive Gates (XOR, XNOR)',
                'SR & JK Flip-Flops',
                'D & T Flip-Flops',
                'Synchronous & Asynchronous Counters',
                '7-Segment Display Decoders',
                'Shift Registers',
                'ADC & DAC Converters'
            ]
        },
        books: [
            {
                id: 'mano-digital',
                title: 'Digital Design (With an Introduction to the Verilog HDL)',
                authors: 'M. Morris Mano, Michael D. Ciletti',
                publisher: 'Pearson Education',
                edition: '6th Edition',
                verifiedUrl: 'https://www.pearson.com/en-us/subject-catalog/p/digital-design/P200000003507',
                conceptsCovered: ['Number Systems', 'Boolean Algebra', 'Logic Gates', 'K-Maps', 'Combinational Logic', 'Sequential Logic', 'Registers & Counters', 'Memory & Programmable Logic']
            },
            {
                id: 'floyd-digital',
                title: 'Digital Fundamentals',
                authors: 'Thomas L. Floyd',
                publisher: 'Pearson Education',
                edition: '11th Edition',
                verifiedUrl: 'https://www.pearson.com/en-us/subject-catalog/p/digital-fundamentals/P200000003508',
                conceptsCovered: ['Binary Arithmetic', 'Logic Gates', 'Boolean Expressions', 'Karnaugh Maps', 'Multiplexers & Decoders', 'Flip-Flops', 'Shift Registers', 'Counters', 'Integrated Circuit Technologies']
            }
        ],
        concepts: [
            {
                name: 'K-Map (Karnaugh Map)',
                definition: 'A visual algebraic simplification method that groups adjacent binary terms on a grid to find minimal Boolean expressions.',
                example: 'Simplifying a 4-variable truth table from 16 minterms down to a 2-gate circuit.',
                usedIn: ['Hardware logic minimization', 'FPGA gate optimization', 'Low-power circuit design']
            },
            {
                name: 'Logic Gates (AND, OR, NOT, NAND, NOR)',
                definition: 'The fundamental physical building blocks of digital electronic circuits that execute Boolean logic operations on binary inputs.',
                example: 'A safety interlock that enables machine startup only when power IS ON (AND) guard door IS CLOSED.',
                usedIn: ['Microprocessor ALU design', 'Decoders', 'Memory cells']
            },
            {
                name: 'Flip-Flop (SR, JK, D, T)',
                definition: 'A bistable multivibrator sequential circuit with two stable states used as a basic 1-bit memory storage element.',
                example: 'A toggle light switch (T Flip-Flop) that alternates state every time a button is pressed.',
                usedIn: ['CPU CPU registers', 'RAM memory cells', 'Frequency dividers']
            },
            {
                name: 'Combinational vs Sequential Circuits',
                definition: 'Combinational circuits depend purely on current inputs (no memory), while Sequential circuits depend on current inputs and past states (clocked memory).',
                example: 'An Adder is combinational; a digital stopwatch counter is sequential.',
                usedIn: ['ALU arithmetic logic', 'State machines', 'Digital clocks']
            },
            {
                name: 'Multiplexer (MUX) & Demultiplexer (DEMUX)',
                definition: 'A digital selector that directs one of several analog or digital input signals into a single output line based on control select lines.',
                example: 'A cable TV box switching between multiple input channels onto a single TV display.',
                usedIn: ['Data routing', 'Parallel-to-serial conversion', 'ALU function selection']
            },
            {
                name: 'Counters & Shift Registers',
                definition: 'Cascaded flip-flop arrays that count input clock pulses in binary sequence or shift binary data serially across memory stages.',
                example: 'A digital speedometer clock counting wheel rotations.',
                usedIn: ['Digital timers', 'Serial communication interfaces (SPI/UART)', 'Frequency division']
            },
            {
                name: 'ADC & DAC (Analog-to-Digital / Digital-to-Analog)',
                definition: 'Converters that translate continuous analog sensor voltages into discrete binary numbers and vice-versa.',
                example: 'A smartphone microphone converting voice soundwaves into binary audio bytes.',
                usedIn: ['Audio processing', 'Sensor interfacing', 'Motor speed control']
            }
        ]
    },
    {
        id: 'coa',
        subject: 'Computer Organization & Architecture',
        shortName: 'COA',
        description: 'Internal operational units of computers, instruction set architecture (ISA), memory hierarchies, and hardware pipelining.',
        interactiveTool: {
            name: 'VisuAlgo & Simulators',
            title: 'Computer Architecture Visualizers',
            description: 'Explore instruction pipelining, cache memory hit/miss cycles, and CPU register operations.',
            url: 'https://visualgo.net/en',
            badge: 'Architecture Simulator Reference',
            topics: [
                'Instruction Cycle (Fetch-Decode-Execute)',
                'Direct-Mapped & Associative Cache',
                'Pipelining Hazards (Data, Structural, Control)',
                'ALU Operations',
                'DMA & Interrupt Processing'
            ]
        },
        books: [
            {
                id: 'pattersen-hennessy',
                title: 'Computer Organization and Design: The Hardware/Software Interface (RISC-V Edition)',
                authors: 'David A. Patterson, John L. Hennessy',
                publisher: 'Morgan Kaufmann / Elsevier',
                edition: 'RISC-V Edition',
                verifiedUrl: 'https://www.elsevier.com/books/computer-organization-and-design-risc-v-edition/patterson/978-0-12-812275-4',
                conceptsCovered: ['Computer Abstractions & Technology', 'Instruction Set Architecture', 'Arithmetic for Computers', 'Processor Datapath & Control', 'Pipelining', 'Memory Hierarchy & Caches', 'Parallel Processors']
            },
            {
                id: 'hamacher-coa',
                title: 'Computer Organization and Embedded Systems',
                authors: 'Carl Hamacher, Zvonko Vranesic, Safwat Zaky, Naraig Manjikian',
                publisher: 'McGraw-Hill Education',
                edition: '6th Edition',
                verifiedUrl: 'https://www.mheducation.com/',
                conceptsCovered: ['Basic Structure of Computers', 'Instruction Set Architecture', 'Basic Processing Unit', 'Pipelining', 'Input/Output Organization', 'Memory System', 'Arithmetic Operations']
            }
        ],
        concepts: [
            {
                name: 'Cache Memory',
                definition: 'A small, ultra-fast static RAM buffer placed between CPU and main memory to accelerate data retrieval using spatial and temporal locality.',
                example: 'Keeping a desk notepad of frequently dialed contacts rather than searching the entire company archive book.',
                usedIn: ['L1/L2/L3 processor caches', 'Web browser caching', 'Database buffer pools']
            },
            {
                name: 'Instruction Pipelining',
                definition: 'An execution optimization technique where multiple instructions are overlapped in execution phases (Fetch, Decode, Execute, Memory, Writeback).',
                example: 'An automotive assembly line where one car is painted while the next car chassis is assembled simultaneously.',
                usedIn: ['Modern superscalar CPU cores', 'GPU shader pipelines', 'RISC microprocessors']
            },
            {
                name: 'Instruction Set Architecture (ISA)',
                definition: 'The abstract hardware-software contract defining supported machine instructions, registers, memory addressing modes, and data types.',
                example: 'x86-64 used in Intel/AMD PCs versus ARM64/RISC-V used in smartphones and Apple Silicon.',
                usedIn: ['Compiler code generation', 'Microprocessor design', 'Virtual machine emulators']
            },
            {
                name: 'ALU (Arithmetic Logic Unit)',
                definition: 'The internal digital circuit within a CPU responsible for performing arithmetic (+, -, *) and bitwise logical (AND, OR, XOR, Shift) calculations.',
                example: 'Executing `a + b` in high-level code translates to binary full-adder operations inside the ALU.',
                usedIn: ['CPU core computation', 'GPU graphics processing', 'Cryptographic accelerators']
            },
            {
                name: 'Direct Memory Access (DMA)',
                definition: 'A hardware feature allowing input/output peripherals to transfer data directly to/from system RAM without consuming CPU clock cycles.',
                example: 'A high-speed NVMe SSD streaming movie frames directly into RAM while the CPU renders graphics.',
                usedIn: ['Network interface cards (NIC)', 'Disk controllers', 'Graphics cards']
            }
        ]
    },
    {
        id: 'daa',
        subject: 'Design & Analysis of Algorithms',
        shortName: 'DAA',
        description: 'Algorithmic paradigms, asymptotic complexity evaluation, graph algorithms, and NP-completeness theory.',
        interactiveTool: {
            name: 'VisuAlgo',
            title: 'Interactive Algorithm Visualizer',
            description: 'Step through Divide and Conquer, Dynamic Programming recursion trees, and shortest path traversals with live animations.',
            url: 'https://visualgo.net/en',
            badge: 'Interactive Visualizer',
            topics: [
                'Big-O Asymptotic Complexity',
                'Divide & Conquer (Merge / Quick Sort)',
                'Greedy Choice Property (Huffman, Fractional Knapsack)',
                'Dynamic Programming (0/1 Knapsack, LCS, Matrix Chain)',
                'Dijkstra & Bellman-Ford Shortest Paths',
                'Travelling Salesperson (TSP) & NP-Hard Problems'
            ]
        },
        books: [
            {
                id: 'clrs-daa',
                title: 'Introduction to Algorithms',
                authors: 'Thomas H. Cormen, Charles E. Leiserson, Ronald L. Rivest, Clifford Stein',
                publisher: 'MIT Press',
                edition: '4th Edition',
                verifiedUrl: 'https://mitpress.mit.edu/9780262046305/introduction-to-algorithms/',
                conceptsCovered: ['Asymptotic Analysis', 'Divide and Conquer', 'Probabilistic Analysis', 'Greedy Algorithms', 'Dynamic Programming', 'Amortized Analysis', 'NP-Completeness', 'Approximation Algorithms']
            },
            {
                id: 'kleinberg-tardos',
                title: 'Algorithm Design',
                authors: 'Jon Kleinberg, Éva Tardos',
                publisher: 'Pearson Education',
                edition: '1st Edition',
                verifiedUrl: 'https://www.pearson.com/en-us/subject-catalog/p/algorithm-design/P200000003510',
                conceptsCovered: ['Basics of Algorithm Analysis', 'Graphs & Connectivity', 'Greedy Algorithms', 'Divide and Conquer', 'Dynamic Programming', 'Network Flow', 'NP and Computational Intractability']
            }
        ],
        concepts: [
            {
                name: 'Asymptotic Complexity (Big-O, Big-Omega, Big-Theta)',
                definition: 'Mathematical notations used to classify algorithms according to how their run time or space requirements grow as the input size n scales.',
                example: 'O(1) is instant array index access, while O(n^2) is nested loop comparison.',
                usedIn: ['Algorithm benchmarking', 'System scalability optimization', 'Software performance engineering']
            },
            {
                name: 'Divide and Conquer',
                definition: 'An algorithmic paradigm that breaks a problem into smaller independent subproblems, solves them recursively, and combines their solutions.',
                example: 'Merge Sort splitting a list of 1,000 items in halves until single elements remain, then merging them in sorted order.',
                usedIn: ['Merge Sort & Quick Sort', 'Fast Fourier Transform (FFT)', 'Strassen matrix multiplication']
            },
            {
                name: 'Greedy Choice Paradigm',
                definition: 'An algorithmic strategy that makes the locally optimal choice at each stage with the hope of finding a global optimum.',
                example: 'Vending machine change calculation dispensing the largest coin denomination first.',
                usedIn: ['Huffman coding compression', 'Dijkstra shortest path', 'Kruskal and Prim MST']
            },
            {
                name: 'Shortest Path Algorithms (Dijkstra vs Bellman-Ford)',
                definition: 'Graph algorithms finding the minimum cost path between vertices; Dijkstra handles non-negative edges in O(E + V log V), while Bellman-Ford handles negative weights.',
                example: 'Google Maps calculating the fastest driving route avoiding toll delays.',
                usedIn: ['Internet routing protocols (OSPF, BGP)', 'Logistics fleet routing', 'Flight connection schedulers']
            },
            {
                name: 'NP-Completeness & Intractability',
                definition: 'A class of decision problems for which no polynomial-time solution is known, but any proposed solution can be verified quickly in polynomial time.',
                example: 'Travelling Salesperson Problem (finding the absolute shortest tour visiting 100 cities).',
                usedIn: ['Cryptography security foundations', 'Circuit routing approximations', 'Optimization solvers']
            }
        ]
    }
];

// GET /api/learning-hub — Returns all subjects, books, concepts, and interactive tool mappings
router.get('/', (req, res) => {
    res.json({
        success: true,
        subjects: LEARNING_RESOURCES
    });
});

// POST /api/learning-hub/explain-concept — On-demand fast AI concept explanation with fallback
router.post('/explain-concept', async (req, res) => {
    const { conceptName, subject } = req.body;
    if (!conceptName) return res.status(400).json({ error: 'Concept name is required' });

    // 1. Check if concept exists in predefined catalog
    let matchedConcept = null;
    for (const sub of LEARNING_RESOURCES) {
        const found = sub.concepts.find(c => c.name.toLowerCase() === conceptName.toLowerCase());
        if (found) {
            matchedConcept = found;
            break;
        }
    }

    // 2. Try Groq AI enhancement
    const aiExplanation = await callGroqExplain(conceptName, subject || 'Computer Science');

    if (aiExplanation) {
        return res.json({
            success: true,
            concept: conceptName,
            explanation: aiExplanation,
            example: matchedConcept?.example || 'Applied in modern software systems.',
            usedIn: matchedConcept?.usedIn || ['Core software engineering', 'System design'],
            source: 'Groq AI (Ultra Fast)'
        });
    }

    // 3. Fallback to predefined verified explanation
    if (matchedConcept) {
        return res.json({
            success: true,
            concept: matchedConcept.name,
            explanation: matchedConcept.definition,
            example: matchedConcept.example,
            usedIn: matchedConcept.usedIn,
            source: 'HyperCampus Curated Knowledgebase'
        });
    }

    // Generic fallback
    res.json({
        success: true,
        concept: conceptName,
        explanation: `${conceptName} is an essential core computer science topic covering structural design, efficiency, and real-world system applications.`,
        example: 'Used across modern computing architectures and algorithm development.',
        usedIn: ['Software Engineering', 'System Architecture'],
        source: 'HyperCampus Knowledgebase'
    });
});

module.exports = router;
