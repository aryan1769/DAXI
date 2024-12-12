import React, { useState, useEffect } from 'react';
import {
    Drawer,
    List,
    ListItem,
    ListItemText,
    AppBar,
    Toolbar,
    Typography,
    IconButton,
    Box,
    CircularProgress,
    Dialog,
    DialogContent,
    DialogTitle,
    Button,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import LocalTaxiIcon from '@mui/icons-material/LocalTaxi';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet'; // Ethereum Icon
import { useUser } from './UserContext';
import axios from 'axios';

const Header = ({ navItems, onMenuItemClick, logoText = "BlockRide" }) => {
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [balance, setBalance] = useState(null);
    const [shortBalance, setShortBalance] = useState(null);
    const [loading, setLoading] = useState(false);
    const { user } = useUser();
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const toggleDrawer = (open) => {
        setIsDrawerOpen(open);
    };

    const fetchBalance = async () => {
        if (!user || !user.ethereumAddress) return;

        setLoading(true);
        try {
            const response = await axios.get(`http://localhost:5000/balance/${user.ethereumAddress}`);
            const balanceValue = parseFloat(response.data.balance);
            setBalance(balanceValue);
            setShortBalance(balanceValue.toFixed(2)); // Display up to 2 decimal points
        } catch (error) {
            console.error('Error fetching balance:', error);
            setBalance(null);
            setShortBalance(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBalance();
    }, [user]);

    const handleBalanceClick = () => {
        if (balance !== null) {
            setIsDialogOpen(true);
        }
    };

    const closeDialog = () => {
        setIsDialogOpen(false);
    };

    return (
        <>
            {/* AppBar Header */}
            <AppBar position="static" sx={{ backgroundColor: '#35a4db' }}>
                <Toolbar>
                    {/* Menu Icon */}
                    <IconButton
                        edge="start"
                        color="inherit"
                        aria-label="menu"
                        onClick={() => toggleDrawer(true)}
                        sx={{ mr: 2 }}
                    >
                        <MenuIcon />
                    </IconButton>

                    {/* Taxi Icon and Company Name */}
                    <Typography
                        variant="h6"
                        sx={{
                            flexGrow: 1,
                            display: 'flex',
                            alignItems: 'center',
                        }}
                    >
                        <LocalTaxiIcon sx={{ mr: 1 }} />
                        {logoText}
                    </Typography>

                    {/* Ethereum Balance */}
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            color: '#fff',
                            cursor: 'pointer',
                        }}
                        onClick={handleBalanceClick}
                    >
                        <AccountBalanceWalletIcon sx={{ mr: 1, fontSize: '1.5rem' }} />
                        {loading ? (
                            <CircularProgress size={20} sx={{ color: '#fff' }} />
                        ) : (
                            <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                                {shortBalance !== null ? `${shortBalance} ETH` : 'N/A'}
                            </Typography>
                        )}
                    </Box>
                </Toolbar>
            </AppBar>

            {/* Navigation Drawer */}
            <Drawer
                anchor="left"
                open={isDrawerOpen}
                onClose={() => toggleDrawer(false)}
            >
                <List sx={{ width: 250 }}>
                    {navItems.map((item, index) => (
                        <ListItem
                            button
                            key={index}
                            onClick={() => {
                                onMenuItemClick(item);
                                toggleDrawer(false); // Close the drawer after click
                            }}
                        >
                            <ListItemText primary={item} />
                        </ListItem>
                    ))}
                </List>
            </Drawer>

            {/* Balance Dialog */}
            <Dialog open={isDialogOpen} onClose={closeDialog}>
                <DialogTitle>Your Full Balance</DialogTitle>
                <DialogContent>
                    <Typography variant="body1" gutterBottom>
                        {balance !== null ? `${balance} ETH` : 'N/A'}
                    </Typography>
                </DialogContent>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', padding: 2 }}>
                    <Button onClick={closeDialog} variant="contained" color="primary">
                        Close
                    </Button>
                </Box>
            </Dialog>
        </>
    );
};

export default Header;
