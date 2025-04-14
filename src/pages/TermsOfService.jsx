import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate } from 'react-router-dom';
import { 
  CheckCircle, 
  Article, 
  PrivacyTip, 
  MonetizationOn, 
  LocalShipping, 
  ContactSupport 
} from '@mui/icons-material';
import { 
  Button, 
  Typography, 
  Container, 
  Box, 
  Paper, 
  Divider, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText,
  CircularProgress,
  Fade
} from '@mui/material';
import { useTheme } from '@mui/material/styles';

const TermsOfService = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [accepted, setAccepted] = useState(false);
  const [scrolledToBottom, setScrolledToBottom] = useState(false);
  const [loading, setLoading] = useState(true);
  const [policies, setPolicies] = useState(null);

  // Simulate fetching policies from backend
  useEffect(() => {
    const fetchPolicies = async () => {
      try {
        // In a real app, this would be an API call to your backend
        // which might fetch from Razorpay's API or your database
        const mockPolicies = {
          terms: {
            title: "Terms of Service",
            content: [
              "By accessing or using Piano Bestie ('Service'), you agree to be bound by these Terms.",
              "The Service provides piano learning resources and requires account creation for full access.",
              "You must be at least 13 years old to use this Service or have parental consent.",
              "We reserve the right to modify these terms at any time with notice."
            ],
            razorpayLink: "https://razorpay.com/terms"
          },
          privacy: {
            title: "Privacy Policy",
            content: [
              "We collect personal data for account management and service improvement.",
              "Payment data is processed securely through Razorpay and not stored on our servers.",
              "We use cookies for essential functionality and analytics.",
              "You may request data deletion by contacting our support team."
            ],
            razorpayLink: "https://razorpay.com/privacy"
          },
          refund: {
            title: "Refund Policy",
            content: [
              "All subscriptions are non-refundable except where required by law.",
              "Refund requests must be made within 14 days of payment.",
              "Digital content purchases are final once accessed.",
              "Chargebacks will result in immediate account termination."
            ],
            razorpayLink: "https://razorpay.com/refund-policy"
          },
          contact: {
            title: "Contact Information",
            content: [
              "For technical support: support@pianobestie.com",
              "For billing inquiries: billing@pianobestie.com",
              "For copyright claims: legal@pianobestie.com",
              "Mailing address: Piano Bestie Inc, 123 Music Lane, San Francisco, CA"
            ]
          }
        };
        
        setPolicies(mockPolicies);
      } catch (error) {
        console.error("Failed to load policies:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPolicies();
  }, []);

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const bottomThreshold = 50; // pixels from bottom
    const isBottom = scrollHeight - (scrollTop + clientHeight) < bottomThreshold;
    setScrolledToBottom(isBottom);
  };

  const handleAccept = () => {
    setAccepted(true);
    // In a real app, you might store this acceptance in your database
    setTimeout(() => navigate('/signup'), 500);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <Helmet>
        <title>Terms of Service | Piano Bestie</title>
        <meta name="description" content="Complete terms of service and policies for Piano Bestie" />
      </Helmet>

      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper elevation={3} sx={{ p: { xs: 2, md: 4 }, borderRadius: 2 }}>
          <Box textAlign="center" mb={4}>
            <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
              Terms & Policies
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Last Updated: {new Date().toLocaleDateString()}
            </Typography>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Box 
            sx={{ 
              maxHeight: '60vh', 
              overflowY: 'auto',
              pr: 2,
              mb: 4,
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 1,
              p: 2
            }}
            onScroll={handleScroll}
          >
            <Section 
              icon={<Article color="primary" />}
              title="1. Terms of Service"
              content={policies.terms.content}
              externalLink={policies.terms.razorpayLink}
              linkText="View Razorpay's Terms"
            />

            <Section 
              icon={<PrivacyTip color="primary" />}
              title="2. Privacy Policy"
              content={policies.privacy.content}
              externalLink={policies.privacy.razorpayLink}
              linkText="View Razorpay's Privacy Policy"
            />

            <Section 
              icon={<MonetizationOn color="primary" />}
              title="3. Payment & Refunds"
              content={policies.refund.content}
              externalLink={policies.refund.razorpayLink}
              linkText="View Razorpay's Refund Policy"
            />

            <Section 
              icon={<ContactSupport color="primary" />}
              title="4. Contact Information"
              content={policies.contact.content}
            />

            <Typography variant="body2" color="text.secondary" sx={{ mt: 4, fontStyle: 'italic' }}>
              By continuing, you acknowledge that you have read and understood all terms and policies above.
            </Typography>
          </Box>

          <Fade in={scrolledToBottom}>
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              p: 2,
              bgcolor: accepted ? 'success.light' : 'primary.light',
              borderRadius: 1,
              transition: 'all 0.3s ease'
            }}>
              <Box display="flex" alignItems="center">
                <CheckCircle sx={{ mr: 1, color: accepted ? 'success.main' : 'primary.main' }} />
                <Typography>
                  {accepted ? 'Terms Accepted!' : 'Please read all terms before continuing'}
                </Typography>
              </Box>
              <Button
                variant="contained"
                size="large"
                disabled={!scrolledToBottom || accepted}
                onClick={handleAccept}
                sx={{ minWidth: 120 }}
              >
                {accepted ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  'I Accept'
                )}
              </Button>
            </Box>
          </Fade>
        </Paper>
      </Container>
    </>
  );
};

// Reusable section component
const Section = ({ icon, title, content, externalLink, linkText }) => {
  return (
    <Box sx={{ mb: 4 }}>
      <Box display="flex" alignItems="center" mb={2}>
        <ListItemIcon sx={{ minWidth: 'auto', mr: 1 }}>
          {icon}
        </ListItemIcon>
        <Typography variant="h5" component="h2" sx={{ fontWeight: 600 }}>
          {title}
        </Typography>
      </Box>
      
      <List dense>
        {content.map((item, index) => (
          <ListItem key={index} sx={{ py: 0.5 }}>
            <ListItemText primary={item} />
          </ListItem>
        ))}
      </List>
      
      {externalLink && (
        <Button 
          variant="text" 
          size="small" 
          href={externalLink} 
          target="_blank"
          rel="noopener noreferrer"
          sx={{ mt: 1 }}
        >
          {linkText}
        </Button>
      )}
      
      <Divider sx={{ mt: 2 }} />
    </Box>
  );
};

export default TermsOfService;