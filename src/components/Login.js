// src/pages/Login.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Box, Button, Input, Text, VStack, Spinner } from "@chakra-ui/react";
import api from "../api/axios";

const Login = () => { // 👈 Remove setUserRole prop
  const { login } = useAuth(); // 👈 Get context function
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (!email.trim() || !password.trim()) {
      setErrorMessage("Email and password are required.");
      return;
    }

    setLoading(true);

    try {
      const response = await api.login({ 
        email: email.trim(), 
        password: password.trim() 
      });

      // Save tokens and role
      localStorage.setItem("jwtToken", response.data.access_token);
      localStorage.setItem("userRole", response.data.user.role);
      localStorage.setItem("user", JSON.stringify(response.data.user)); // 👈 Add this
      
      // Force UI update and redirect
      login(response.data.user, response.data.user.role); // 👈 Critical context update
      navigate("/dashboard", { replace: true });

    } catch (error) {
      setErrorMessage(
        error.response?.data?.message || 
        "Login failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box maxW="400px" mx="auto" mt="100px" p={5} borderWidth="1px" borderRadius="md">
      <VStack spacing={4} align="stretch">
        <Input
          placeholder="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {errorMessage && <Text color="red.500">{errorMessage}</Text>}
        <Button 
          colorScheme="blue" 
          onClick={handleLogin} 
          isDisabled={loading}
        >
          {loading ? <Spinner size="sm" /> : "Login"}
        </Button>
      </VStack>
    </Box>
  );
};

export default Login;