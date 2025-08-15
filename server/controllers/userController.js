const supabase = require('../utils/supabase');
const { getOrCreateUserUUID } = require('../utils/userMapping');

const createUser = async (req, res) => {
  try {
    const { userId } = req.auth;
    const { emailAddress, firstName, lastName, email, name } = req.body;

    // Convert Clerk ID to UUID
    const userUUID = await getOrCreateUserUUID(userId);

    const userData = {
      name: name || `${firstName || ''} ${lastName || ''}`.trim() || 'User',
      email: email || emailAddress || '',
    };

    const { data, error } = await supabase
      .from('profiles')
      .update(userData)
      .eq('id', userUUID)
      .select()
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows updated
      console.error('Error updating user profile:', error);
      return res.status(400).json({ error: error.message });
    }

    if (error && error.code === 'PGRST116') {
      const { data: existingData, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userUUID)
        .single();

      if (fetchError) {
        console.error('Error fetching user profile:', fetchError);
        return res.status(400).json({ error: fetchError.message });
      }

      return res.json({ message: 'User profile exists', user: existingData });
    }

    res.json({ message: 'User created/updated successfully', user: data });
  } catch (error) {
    console.error('Error in createUser:', error);
    res.status(500).json({ error: error.message });
  }
};

const getUser = async (req, res) => {
  try {
    const { userId } = req.auth;

    // Convert Clerk ID to UUID
    const userUUID = await getOrCreateUserUUID(userId);

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userUUID)
      .single();

    if (error) {
      console.error('Database error in getUser:', error);
      return res.status(404).json({ error: 'User not found', details: error.message });
    }

    res.json(data);
  } catch (error) {
    console.error('Error in getUser:', error);
    res.status(500).json({ error: error.message });
  }
};

const setInitialUsername = async (req, res) => {
  try {
    const { userId } = req.auth;
    const { username } = req.body;

    if (!username?.trim()) {
      return res.status(400).json({ error: 'Username is required' });
    }

    // Convert Clerk ID to UUID
    const userUUID = await getOrCreateUserUUID(userId);

    const { clerkClient } = require('@clerk/clerk-sdk-node');
    let email = '';
    
    try {
      const clerkUser = await clerkClient.users.getUser(userId);
      email = clerkUser.primaryEmailAddress?.emailAddress || 
              clerkUser.emailAddress || 
              (clerkUser.emailAddresses && clerkUser.emailAddresses[0]?.emailAddress) ||
              '';
    } catch (clerkError) {
      console.error('Error fetching Clerk user for email:', clerkError);
    }

    const updateData = { name: username.trim() };
    if (email) {
      updateData.email = email;
    }

    const { data, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', userUUID)
      .select()
      .single();

    if (error) {
      console.error('Error updating profile:', error);
      return res.status(400).json({ error: error.message });
    }

    res.json({ message: 'Profile updated successfully', user: data });
  } catch (error) {
    console.error('Error in setInitialUsername:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = { createUser, getUser, setInitialUsername };
