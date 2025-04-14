import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { 
  CheckCircle, 
  Article, 
  PrivacyTip, 
  MonetizationOn,
  ContactSupport,
  Payment,
  LocalShipping
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
  Fade,
  Link
} from '@mui/material';
import { useTheme } from '@mui/material/styles';

const TermsOfService = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [accepted, setAccepted] = useState(false);
  const [scrolledToBottom, setScrolledToBottom] = useState(false);
  const [loading, setLoading] = useState(true);
  const [policies, setPolicies] = useState(null);

  useEffect(() => {
    const fetchPolicies = async () => {
      try {
        const mockPolicies = {
          ourTerms: {
            title: "Piano Bestie Terms",
            content: [
              "Annual subscription fee: ₹599 (non-refundable after purchase)",
              "Immediate access revocation upon cancellation",
              "New ₹599 payment required to rejoin after cancellation",
              "No prorated refunds for unused subscription time",
              "Auto-renewal occurs 24 hours before subscription end date"
            ]
          },
          ourPrivacy: {
            title: "Our Privacy Policy",
            content: [
              "We collect only necessary account and usage data",
              "Payment information processed securely via Razorpay",
              "Data never sold to third parties",
              "Account deletion available upon request"
            ]
          },
          razorpayTerms: {
            title: "Payment Terms (via Razorpay)",
            content: [
              "All transactions processed through Razorpay",
              "Payment disputes must be handled through Razorpay",
              "Refunds processed according to Razorpay's policies"
            ],
            link: "https://merchant.razorpay.com/policy/QFLtWjASEokUUs/terms"
          },
          razorpayPrivacy: {
            title: "Razorpay Privacy Policy",
            content: [
              "Razorpay collects payment information as needed",
              "See their full privacy policy for details"
            ],
            link: "https://merchant.razorpay.com/policy/QFLtWjASEokUUs/privacy"
          },
          razorpayRefund: {
            title: "Razorpay Refund Policy",
            content: [
              "Refunds processed according to Razorpay's timeline",
              "All refunds subject to Razorpay's terms"
            ],
            link: "https://merchant.razorpay.com/policy/QFLtWjASEokUUs/refund"
          },
          contact: {
            title: "Contact Information",
            content: [
              "Piano Bestie support: support@pianobestie.com",
              "Razorpay support: via their contact page",
              "Mailing address: Piano Bestie Inc, 123 Music Lane, Mumbai, India"
            ],
            razorpayContact: "https://merchant.razorpay.com/policy/QFLtWjASEokUUs/contact_us"
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
    const bottomThreshold = 50;
    const isBottom = scrollHeight - (scrollTop + clientHeight) < bottomThreshold;
    setScrolledToBottom(isBottom);
  };

  const handleAccept = () => {
    setAccepted(true);
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
            {/* Our Policies */}
            <Section 
              icon={<MonetizationOn color="primary" />}
              title="1. Piano Bestie Subscription Terms"
              content={policies?.ourTerms.content}
            />

            <Section 
              icon={<PrivacyTip color="primary" />}
              title="2. Our Privacy Policy"
              content={policies?.ourPrivacy.content}
            />

            {/* Razorpay Policies */}
            <Section 
              icon={<Payment color="primary" />}
              title="3. Payment Processing Terms"
              content={policies?.razorpayTerms.content}
              externalLink={policies?.razorpayTerms.link}
              linkText="View Razorpay's Full Terms"
            />

            <Section 
              icon={<PrivacyTip color="primary" />}
              title="4. Payment Provider Privacy Policy"
              content={policies?.razorpayPrivacy.content}
              externalLink={policies?.razorpayPrivacy.link}
              linkText="View Razorpay's Privacy Policy"
            />

            <Section 
              icon={<MonetizationOn color="primary" />}
              title="5. Refund Processing"
              content={policies?.razorpayRefund.content}
              externalLink={policies?.razorpayRefund.link}
              linkText="View Razorpay's Refund Policy"
            />

            <Section 
              icon={<ContactSupport color="primary" />}
              title="6. Contact Information"
              content={policies?.contact.content}
              externalLink={policies?.contact.razorpayContact}
              linkText="Contact Razorpay Support"
            />

            <Typography variant="body2" color="text.secondary" sx={{ mt: 4, fontStyle: 'italic' }}>
              By continuing, you agree to both Piano Bestie's terms and Razorpay's payment terms.
            </Typography>
          </Box>

          {policies && (
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
          )}
        </Paper>
      </Container>
    </>
  );
};

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
        {content?.map((item, index) => (
          <ListItem key={index} sx={{ py: 0.5 }}>
            <ListItemText primary={item} />
          </ListItem>
        ))}
      </List>
      
      {externalLink && (
        <Button 
          component={Link}
          to="#"
          onClick={(e) => {
            e.preventDefault();
            window.open(externalLink, '_blank', 'noopener,noreferrer');
          }}
          variant="text" 
          size="small"
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