import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Divider,
  Card,
  CardContent,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  AccountBalanceWallet as WalletIcon,
  Add as AddIcon,
  History as HistoryIcon,
  CurrencyRupee as CurrencyRupeeIcon,
  Check as CheckIcon,
  Error as ErrorIcon,
  Pending as PendingIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { walletApi } from '../services/api';
import toast from 'react-hot-toast';

interface Transaction {
  _id: string;
  type: 'deposit' | 'withdrawal' | 'transfer' | 'payment';
  amount: number;
  description: string;
  status: 'pending' | 'completed' | 'failed';
  paymentMethod?: string;
  reference?: string;
  createdAt: string;
}

interface Wallet {
  _id: string;
  user: string;
  balance: number;
  currency: string;
  transactions: Transaction[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const WalletSection: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [loading, setLoading] = useState(true);
  const [addMoneyDialogOpen, setAddMoneyDialogOpen] = useState(false);
  const [transactionsDialogOpen, setTransactionsDialogOpen] = useState(false);
  const [addingMoney, setAddingMoney] = useState(false);
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [transactionsLoading, setTransactionsLoading] = useState(false);

  useEffect(() => {
    fetchWallet();
  }, []);

  const fetchWallet = async () => {
    setLoading(true);
    try {
      const response = await walletApi.getWallet();
      setWallet(response.data);
    } catch (error: any) {
      console.error('Error fetching wallet:', error);
      // Don't show error notification - create a default wallet object
      setWallet({
        _id: '',
        user: '',
        balance: 0,
        currency: 'INR',
        transactions: [],
        isActive: true,
        createdAt: '',
        updatedAt: ''
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    setTransactionsLoading(true);
    try {
      const response = await walletApi.getTransactions(1, 50);
      setTransactions(response.data.transactions);
    } catch (error: any) {
      console.error('Error fetching transactions:', error);
      // Don't show error notification - fail silently
      setTransactions([]);
    } finally {
      setTransactionsLoading(false);
    }
  };

  const handleAddMoney = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (parseFloat(amount) > 50000) {
      toast.error('Maximum deposit amount is ₹50,000');
      return;
    }

    // Demo functionality - show coming soon message
    toast.success(`💰 Add Money feature is coming soon! You tried to add ₹${amount} to your wallet.`);
    setAddMoneyDialogOpen(false);
    setAmount('');
  };

  const handleViewTransactions = () => {
    setTransactionsDialogOpen(true);
    fetchTransactions();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckIcon color="success" />;
      case 'failed':
        return <ErrorIcon color="error" />;
      case 'pending':
        return <PendingIcon color="warning" />;
      default:
        return <PendingIcon />;
    }
  };

  const getStatusColor = (status: string): "success" | "error" | "warning" | "default" => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'failed':
        return 'error';
      case 'pending':
        return 'warning';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Paper sx={{ 
      p: { xs: 2, sm: 3 }, 
      mb: { xs: 2, sm: 3 },
      mx: { xs: 1, sm: 0 },
      borderRadius: { xs: 0, sm: 1 },
      boxShadow: { xs: 'none', sm: 1 },
      border: { xs: '1px solid', sm: 'none' },
      borderColor: 'divider'
    }}>
      <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <WalletIcon />
        My Wallet
      </Typography>

      {/* Wallet Balance Card */}
      <Card sx={{ 
        mb: 3, 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white'
      }}>
        <CardContent sx={{ textAlign: 'center', py: { xs: 2, sm: 3 } }}>
          <Typography variant="h6" sx={{ mb: 1, opacity: 0.9 }}>
            Available Balance
          </Typography>
          <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1 }}>
            {formatCurrency(wallet?.balance || 0)}
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.8 }}>
            {wallet?.currency || 'INR'}
          </Typography>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <Box sx={{ 
        display: 'flex', 
        gap: 2, 
        mb: 3,
        flexDirection: { xs: 'column', sm: 'row' }
      }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setAddMoneyDialogOpen(true)}
          fullWidth={isMobile}
          sx={{ 
            py: { xs: 1.5, sm: 1 },
            background: 'linear-gradient(45deg, #4CAF50 30%, #45a049 90%)'
          }}
        >
          Add Money
        </Button>
        
        <Button
          variant="outlined"
          startIcon={<HistoryIcon />}
          onClick={handleViewTransactions}
          fullWidth={isMobile}
          sx={{ py: { xs: 1.5, sm: 1 } }}
        >
          Transaction History
        </Button>
      </Box>

      {/* Recent Transactions */}
      {wallet?.transactions && wallet.transactions.length > 0 && (
        <Box>
          <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'medium' }}>
            Recent Transactions
          </Typography>
          <List sx={{ maxHeight: 200, overflow: 'auto' }}>
            {wallet.transactions.slice(0, 3).map((transaction) => (
              <ListItem key={transaction._id} sx={{ px: 0 }}>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getStatusIcon(transaction.status)}
                      <Typography variant="body2">
                        {transaction.description}
                      </Typography>
                    </Box>
                  }
                  secondary={
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(transaction.createdAt).toLocaleDateString()}
                      </Typography>
                      <Typography 
                        variant="caption" 
                        color={transaction.type === 'deposit' ? 'success.main' : 'error.main'}
                        sx={{ fontWeight: 'medium' }}
                      >
                        {transaction.type === 'deposit' ? '+' : '-'}
                        {formatCurrency(transaction.amount)}
                      </Typography>
                    </Box>
                  }
                />
              </ListItem>
            ))}
          </List>
        </Box>
      )}

      {/* Add Money Dialog */}
      <Dialog open={addMoneyDialogOpen} onClose={() => setAddMoneyDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Money to Wallet</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            This is a demo wallet. In production, you would integrate with real payment gateways.
          </Alert>
          
          <TextField
            fullWidth
            label="Amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            margin="normal"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <CurrencyRupeeIcon />
                </InputAdornment>
              ),
            }}
            helperText="Minimum: ₹1, Maximum: ₹50,000"
            inputProps={{ min: 1, max: 50000 }}
          />
          
          <FormControl fullWidth margin="normal">
            <InputLabel>Payment Method</InputLabel>
            <Select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              label="Payment Method"
            >
              <MenuItem value="card">Credit/Debit Card</MenuItem>
              <MenuItem value="upi">UPI</MenuItem>
              <MenuItem value="bank_transfer">Bank Transfer</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddMoneyDialogOpen(false)} disabled={addingMoney}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleAddMoney}
            disabled={addingMoney || !amount}
          >
            {addingMoney ? <CircularProgress size={20} /> : 'Add Money'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Transactions Dialog */}
      <Dialog 
        open={transactionsDialogOpen} 
        onClose={() => setTransactionsDialogOpen(false)} 
        maxWidth="md" 
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Button
              variant="text"
              startIcon={<ArrowBackIcon />}
              onClick={() => setTransactionsDialogOpen(false)}
              sx={{ minWidth: 'auto', p: 1 }}
            >
              Back
            </Button>
            <Typography variant="h6" sx={{ flex: 1 }}>
              Transaction History
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          {transactionsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : transactions.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <HistoryIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                No transactions yet
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Your transaction history will appear here
              </Typography>
            </Box>
          ) : (
            <List>
              {transactions.map((transaction, index) => (
                <React.Fragment key={transaction._id}>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {getStatusIcon(transaction.status)}
                            <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                              {transaction.description}
                            </Typography>
                          </Box>
                          <Typography 
                            variant="h6" 
                            color={transaction.type === 'deposit' ? 'success.main' : 'error.main'}
                            sx={{ fontWeight: 'bold' }}
                          >
                            {transaction.type === 'deposit' ? '+' : '-'}
                            {formatCurrency(transaction.amount)}
                          </Typography>
                        </Box>
                      }
                      secondary={
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                            <Chip 
                              label={transaction.status} 
                              size="small" 
                              color={getStatusColor(transaction.status)}
                              variant="outlined"
                            />
                            {transaction.paymentMethod && (
                              <Chip 
                                label={transaction.paymentMethod.toUpperCase()} 
                                size="small" 
                                variant="outlined"
                              />
                            )}
                          </Box>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(transaction.createdAt).toLocaleString()}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < transactions.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTransactionsDialogOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default WalletSection;