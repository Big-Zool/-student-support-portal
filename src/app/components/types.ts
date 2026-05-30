export type Role = 'student' | 'sales' | 'manager';
export type ConversationStatus = 'open' | 'pending' | 'closed';

export interface Message {
  id: string;
  content: string;
  sender: 'student' | 'team';
  senderName: string;
  timestamp: Date;
}

export interface Conversation {
  id: string;
  subject: string;
  status: ConversationStatus;
  studentName: string;
  studentEmail: string;
  assignee: string | null;
  lastMessage: string;
  lastMessageTime: Date;
  messages: Message[];
}

export const MANAGER_USER = 'Admin';
export const SALES_AGENTS = ['Aigerim', 'Alex', 'Jordan'];
export const CURRENT_SALES_USER = 'Alex';
export const STUDENT_EMAIL = 'emma.chen@student.edu';

const now = Date.now();

export const INITIAL_CONVERSATIONS: Conversation[] = [
  {
    id: '1',
    subject: 'Admission requirements',
    status: 'open',
    studentName: 'Emma Chen',
    studentEmail: 'emma.chen@student.edu',
    assignee: 'Alex',
    lastMessage: 'Can you please share the exact document list?',
    lastMessageTime: new Date(now - 1000 * 60 * 12),
    messages: [
      {
        id: 'm1',
        content: 'Hi, I need help with admission requirements for the MBA program.',
        sender: 'student',
        senderName: 'Emma Chen',
        timestamp: new Date(now - 1000 * 60 * 120),
      },
      {
        id: 'm2',
        content:
          "Hello Emma! I'd be happy to help. For the MBA program, you'll need a bachelor's degree, GMAT/GRE scores, and two letters of recommendation.",
        sender: 'team',
        senderName: 'Alex',
        timestamp: new Date(now - 1000 * 60 * 90),
      },
      {
        id: 'm3',
        content: 'Thank you! What about work experience requirements?',
        sender: 'student',
        senderName: 'Emma Chen',
        timestamp: new Date(now - 1000 * 60 * 60),
      },
      {
        id: 'm4',
        content:
          'We typically require a minimum of 2 years of professional work experience. However, exceptional candidates may be considered with less.',
        sender: 'team',
        senderName: 'Alex',
        timestamp: new Date(now - 1000 * 60 * 45),
      },
      {
        id: 'm5',
        content: 'Can you please share the exact document list?',
        sender: 'student',
        senderName: 'Emma Chen',
        timestamp: new Date(now - 1000 * 60 * 12),
      },
    ],
  },
  {
    id: '2',
    subject: 'Visa document checklist',
    status: 'pending',
    studentName: 'Marcus Johnson',
    studentEmail: 'marcus.j@student.edu',
    assignee: 'Aigerim',
    lastMessage: "I've submitted all the documents you mentioned.",
    lastMessageTime: new Date(now - 1000 * 60 * 180),
    messages: [
      {
        id: 'm6',
        content: 'Hello, I need the visa document checklist for international students.',
        sender: 'student',
        senderName: 'Marcus Johnson',
        timestamp: new Date(now - 1000 * 60 * 300),
      },
      {
        id: 'm7',
        content:
          "Hi Marcus! You'll need: a valid passport, I-20 form, financial statements, and the SEVIS fee receipt.",
        sender: 'team',
        senderName: 'Aigerim',
        timestamp: new Date(now - 1000 * 60 * 240),
      },
      {
        id: 'm8',
        content: "I've submitted all the documents you mentioned.",
        sender: 'student',
        senderName: 'Marcus Johnson',
        timestamp: new Date(now - 1000 * 60 * 180),
      },
    ],
  },
  {
    id: '3',
    subject: 'Tuition fee schedule',
    status: 'closed',
    studentName: 'Emma Chen',
    studentEmail: 'emma.chen@student.edu',
    assignee: 'Alex',
    lastMessage: 'Perfect, thank you for the information!',
    lastMessageTime: new Date(now - 1000 * 60 * 60 * 24),
    messages: [
      {
        id: 'm9',
        content: 'What is the tuition fee for the upcoming semester?',
        sender: 'student',
        senderName: 'Emma Chen',
        timestamp: new Date(now - 1000 * 60 * 60 * 26),
      },
      {
        id: 'm10',
        content: 'The tuition for the fall semester is $18,500. Payment plans are available in 3 or 6 month installments.',
        sender: 'team',
        senderName: 'Alex',
        timestamp: new Date(now - 1000 * 60 * 60 * 25),
      },
      {
        id: 'm11',
        content: 'Perfect, thank you for the information!',
        sender: 'student',
        senderName: 'Emma Chen',
        timestamp: new Date(now - 1000 * 60 * 60 * 24),
      },
    ],
  },
  {
    id: '4',
    subject: 'Dormitory availability inquiry',
    status: 'open',
    studentName: 'Sarah Park',
    studentEmail: 'sarah.park@student.edu',
    assignee: null,
    lastMessage: 'Are there any rooms available for the spring semester?',
    lastMessageTime: new Date(now - 1000 * 60 * 25),
    messages: [
      {
        id: 'm12',
        content: "Hi, I'm looking for dormitory accommodation for the spring semester.",
        sender: 'student',
        senderName: 'Sarah Park',
        timestamp: new Date(now - 1000 * 60 * 40),
      },
      {
        id: 'm13',
        content: 'Are there any rooms available for the spring semester?',
        sender: 'student',
        senderName: 'Sarah Park',
        timestamp: new Date(now - 1000 * 60 * 25),
      },
    ],
  },
  {
    id: '5',
    subject: 'Course registration portal error',
    status: 'open',
    studentName: 'David Kim',
    studentEmail: 'david.kim@student.edu',
    assignee: 'Jordan',
    lastMessage: 'The portal keeps showing an error when I try to register.',
    lastMessageTime: new Date(now - 1000 * 60 * 5),
    messages: [
      {
        id: 'm14',
        content: "I'm having trouble with the course registration portal.",
        sender: 'student',
        senderName: 'David Kim',
        timestamp: new Date(now - 1000 * 60 * 30),
      },
      {
        id: 'm15',
        content: "Hi David! Could you describe the exact error message you're seeing?",
        sender: 'team',
        senderName: 'Jordan',
        timestamp: new Date(now - 1000 * 60 * 20),
      },
      {
        id: 'm16',
        content: 'The portal keeps showing an error when I try to register.',
        sender: 'student',
        senderName: 'David Kim',
        timestamp: new Date(now - 1000 * 60 * 5),
      },
    ],
  },
];
