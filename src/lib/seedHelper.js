import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import connectToDatabase from './db';
import Author from '../models/Author';
import User from '../models/User';
import Ticket from '../models/Ticket';

export async function seedDatabase(force = false) {
  await connectToDatabase();

  const authorCount = await Author.countDocuments();
  if (authorCount > 0 && !force) {
    return { success: true, message: 'Database already seeded in bookleaf_portal', count: authorCount };
  }

  // Load sample json
  const jsonPath = path.join(process.cwd(), 'bookleaf_sample_data.json');
  const rawData = fs.readFileSync(jsonPath, 'utf-8');
  const parsedData = JSON.parse(rawData);
  const authorsList = parsedData.authors || [];

  if (force) {
    // Only delete from our namespaced collections in bookleaf_portal!
    await Author.deleteMany({});
    await User.deleteMany({});
    await Ticket.deleteMany({});
  }

  const defaultAuthorPassword = await bcrypt.hash('bookleaf123', 10);
  const defaultAdminPassword = await bcrypt.hash('admin123', 10);

  // 1. Insert Authors
  for (const author of authorsList) {
    await Author.findOneAndUpdate(
      { author_id: author.author_id },
      author,
      { upsert: true, new: true }
    );

    // 2. Create User account for Author
    await User.findOneAndUpdate(
      { email: author.email.toLowerCase() },
      {
        email: author.email.toLowerCase(),
        password: defaultAuthorPassword,
        name: author.name,
        role: 'author',
        author_id: author.author_id,
        phone: author.phone || '',
      },
      { upsert: true, new: true }
    );
  }

  // 3. Create Default Admin Accounts
  const adminUsers = [
    {
      email: 'admin@bookleaf.pub',
      password: defaultAdminPassword,
      name: 'Aditi Verma (Support Lead)',
      role: 'admin',
      phone: '+91-99887-76655',
    },
    {
      email: 'ops@bookleaf.pub',
      password: defaultAdminPassword,
      name: 'Rohan Mehta (Operations Manager)',
      role: 'admin',
      phone: '+91-99887-76654',
    },
  ];

  for (const admin of adminUsers) {
    await User.findOneAndUpdate(
      { email: admin.email.toLowerCase() },
      admin,
      { upsert: true, new: true }
    );
  }

  // 4. Seed initial representative sample tickets
  const initialTicketCount = await Ticket.countDocuments();
  if (initialTicketCount === 0) {
    const sampleTickets = [
      {
        ticket_number: 'BLP-1001',
        author_id: 'AUTH001',
        author_name: 'Priya Sharma',
        author_email: 'priya.sharma@email.com',
        book_id: 'BK001',
        book_title: 'Whispers of the Ganges',
        subject: 'Royalty payout inquiry for Q3 cycle',
        description: 'Hello team, I noticed my pending royalty is ₹3,570 for Whispers of the Ganges. When is the next bank transfer scheduled to hit my account?',
        category: 'Royalty & Payments',
        ai_category: 'Royalty & Payments',
        priority: 'High',
        ai_priority: 'High',
        ai_confidence_reasoning: 'Inquiry regarding pending royalty disbursement cycle with specific balance of ₹3,570.',
        status: 'In Progress',
        assigned_to: 'admin@bookleaf.pub',
        assigned_name: 'Aditi Verma (Support Lead)',
        ai_draft_response: `Dear Priya Sharma,\n\nThank you for reaching out regarding your pending royalty of ₹3,570 for "Whispers of the Ganges".\n\nOur records confirm that your account has accumulated ₹3,570 in pending royalties, comfortably above our ₹1,000 threshold. Royalties for this quarter are calculated and scheduled for electronic transfer within 45 days of the quarter ending.\n\nOur finance department has scheduled the upcoming batch for processing. We will verify your bank IFSC details and confirm the transaction reference number within 48 hours.\n\nWarm regards,\nBookLeaf Author Support Team`,
        messages: [
          {
            sender_role: 'author',
            sender_name: 'Priya Sharma',
            message: 'Hello team, I noticed my pending royalty is ₹3,570 for Whispers of the Ganges. When is the next bank transfer scheduled to hit my account?',
            created_at: new Date(Date.now() - 36 * 3600 * 1000),
          },
          {
            sender_role: 'admin',
            sender_name: 'Aditi Verma (Support Lead)',
            message: 'Hi Priya, thank you for reaching out! Your balance of ₹3,570 is queued for our mid-month payout cycle. We are verifying the bank IFSC code with the accounts desk right now.',
            created_at: new Date(Date.now() - 12 * 3600 * 1000),
          },
        ],
        internal_notes: [
          {
            admin_name: 'Aditi Verma',
            admin_email: 'admin@bookleaf.pub',
            note: 'Verified with ICICI payout file. Payout scheduled in next batch.',
            created_at: new Date(Date.now() - 11 * 3600 * 1000),
          },
        ],
        created_at: new Date(Date.now() - 36 * 3600 * 1000),
      },
      {
        ticket_number: 'BLP-1002',
        author_id: 'AUTH007',
        author_name: 'Sneha Kulkarni',
        author_email: 'sneha.kulkarni@email.com',
        book_id: 'BK013',
        book_title: 'Midnight in Mysore',
        subject: 'Cover design proofs timeline',
        description: 'Hi! "Midnight in Mysore" has been in Cover Design status for a couple of weeks now. Could you please share the draft proofs so I can review them?',
        category: 'Book Status & Production Updates',
        ai_category: 'Book Status & Production Updates',
        priority: 'Medium',
        ai_priority: 'Medium',
        ai_confidence_reasoning: 'Production stage delay inquiry for an unpublished manuscript in Cover Design.',
        status: 'Open',
        assigned_to: 'Unassigned',
        ai_draft_response: `Dear Sneha Kulkarni,\n\nThank you for checking in on the progress of "Midnight in Mysore". We know how exciting it is to see your book cover take shape!\n\nOur design studio in Delhi has completed 2 initial front and back concept directions for your thriller. We are making final typographical polish on the spine thickness for print specs. You will receive an email with high-resolution PDF proofs within 48 hours for your direct feedback.\n\nWarm regards,\nBookLeaf Author Support Team`,
        messages: [
          {
            sender_role: 'author',
            sender_name: 'Sneha Kulkarni',
            message: 'Hi! "Midnight in Mysore" has been in Cover Design status for a couple of weeks now. Could you please share the draft proofs so I can review them?',
            created_at: new Date(Date.now() - 48 * 3600 * 1000),
          },
        ],
        created_at: new Date(Date.now() - 48 * 3600 * 1000),
      },
      {
        ticket_number: 'BLP-1003',
        author_id: 'AUTH009',
        author_name: 'Kavita Deshmukh',
        author_email: 'kavita.deshmukh@email.com',
        book_id: 'BK016',
        book_title: 'The Nagpur Notebooks',
        subject: 'Did not receive royalty transfer for ₹850',
        description: 'My dashboard shows ₹850 earned for The Nagpur Notebooks, but no money has entered my bank account yet. Is there an issue with my bank details?',
        category: 'Royalty & Payments',
        ai_category: 'Royalty & Payments',
        priority: 'Medium',
        ai_priority: 'Medium',
        ai_confidence_reasoning: 'Royalty below minimum threshold inquiry. Explains BookLeaf ₹1,000 threshold rollover rule.',
        status: 'Open',
        assigned_to: 'Unassigned',
        ai_draft_response: `Dear Kavita Deshmukh,\n\nThank you for reaching out to us. Congratulations on the steady sales of "The Nagpur Notebooks"!\n\nI am glad to clarify how our payout threshold works. As outlined in BookLeaf's Royalty Policy, we have a minimum payout threshold of ₹1,000 per payout cycle. Currently, your accumulated royalty stands at ₹850. Because this is just under ₹1,000, the amount is completely safe and rolls over automatically into the current quarter.\n\nAs soon as your total royalties cross ₹1,000, the full accumulated sum will be transferred to your bank account on the next scheduled quarterly date.\n\nWarm regards,\nBookLeaf Author Support Team`,
        messages: [
          {
            sender_role: 'author',
            sender_name: 'Kavita Deshmukh',
            message: 'My dashboard shows ₹850 earned for The Nagpur Notebooks, but no money has entered my bank account yet. Is there an issue with my bank details?',
            created_at: new Date(Date.now() - 20 * 3600 * 1000),
          },
        ],
        created_at: new Date(Date.now() - 20 * 3600 * 1000),
      },
    ];

    for (const ticket of sampleTickets) {
      await Ticket.create(ticket);
    }
  }

  return {
    success: true,
    database: 'bookleaf_portal',
    authorsCount: authorsList.length,
    usersCount: authorsList.length + adminUsers.length,
    message: 'Seeding completed in isolated bookleaf_portal database',
  };
}
