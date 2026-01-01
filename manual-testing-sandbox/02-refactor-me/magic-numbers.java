// REFACTOR ME: Magic numbers and strings that should be constants

public class PaymentProcessor {

    public double calculateDiscount(double total, int customerLevel) {
        // Magic numbers everywhere!
        if (customerLevel >= 5) {
            return total * 0.25;  // What is 0.25?
        } else if (customerLevel >= 3) {
            return total * 0.15;  // What is 0.15?
        } else if (customerLevel >= 1) {
            return total * 0.05;  // What is 0.05?
        }
        return 0;
    }

    public double calculateShipping(double weight, String destination) {
        double baseCost = 5.99;  // Magic number
        double perPoundCost = 0.75;  // Magic number
        
        double shippingCost = baseCost + (weight * perPoundCost);
        
        // Magic strings for destination codes
        if (destination.equals("US")) {
            return shippingCost;
        } else if (destination.equals("CA")) {
            return shippingCost * 1.5;  // Magic number
        } else if (destination.equals("UK")) {
            return shippingCost * 2.0;  // Magic number
        } else if (destination.equals("AU")) {
            return shippingCost * 2.5;  // Magic number
        } else {
            return shippingCost * 3.0;  // Magic number for "international"
        }
    }

    public String getOrderStatus(int statusCode) {
        // Magic numbers for status codes
        if (statusCode == 0) {
            return "PENDING";
        } else if (statusCode == 1) {
            return "PROCESSING";
        } else if (statusCode == 2) {
            return "SHIPPED";
        } else if (statusCode == 3) {
            return "DELIVERED";
        } else if (statusCode == 4) {
            return "CANCELLED";
        } else if (statusCode == 5) {
            return "REFUNDED";
        }
        return "UNKNOWN";
    }

    public boolean isValidCreditCard(String cardNumber) {
        // Magic numbers for card validation
        if (cardNumber.length() < 13 || cardNumber.length() > 19) {
            return false;
        }
        
        // Magic strings for card prefixes
        if (cardNumber.startsWith("4")) {
            return cardNumber.length() == 16;  // Visa
        } else if (cardNumber.startsWith("5")) {
            return cardNumber.length() == 16;  // Mastercard
        } else if (cardNumber.startsWith("34") || cardNumber.startsWith("37")) {
            return cardNumber.length() == 15;  // Amex
        } else if (cardNumber.startsWith("6011")) {
            return cardNumber.length() == 16;  // Discover
        }
        return false;
    }

    public double calculateTax(double amount, String state) {
        // Magic tax rates
        if (state.equals("CA")) {
            return amount * 0.0725;
        } else if (state.equals("NY")) {
            return amount * 0.08;
        } else if (state.equals("TX")) {
            return amount * 0.0625;
        } else if (state.equals("FL")) {
            return amount * 0.06;
        } else if (state.equals("WA")) {
            return amount * 0.065;
        } else if (state.equals("OR") || state.equals("NH") || state.equals("MT")) {
            return 0;  // No sales tax states
        }
        return amount * 0.05;  // Default tax rate
    }

    public int calculateLoyaltyPoints(double purchaseAmount, String tier) {
        // Magic multipliers
        int basePoints = (int) (purchaseAmount * 1);  // 1 point per dollar
        
        if (tier.equals("BRONZE")) {
            return basePoints;
        } else if (tier.equals("SILVER")) {
            return (int) (basePoints * 1.5);
        } else if (tier.equals("GOLD")) {
            return basePoints * 2;
        } else if (tier.equals("PLATINUM")) {
            return basePoints * 3;
        } else if (tier.equals("DIAMOND")) {
            return basePoints * 5;
        }
        return basePoints;
    }

    public boolean canProcessRefund(int daysSincePurchase, double refundAmount) {
        // Magic numbers for refund policy
        if (daysSincePurchase > 30) {
            return false;  // 30-day return policy
        }
        if (refundAmount > 10000) {
            return false;  // Max refund amount
        }
        if (daysSincePurchase > 14 && refundAmount > 500) {
            return false;  // After 14 days, max $500
        }
        return true;
    }

    public double calculateSubscriptionPrice(String plan, int months) {
        double monthlyPrice;
        
        // Magic prices
        if (plan.equals("BASIC")) {
            monthlyPrice = 9.99;
        } else if (plan.equals("STANDARD")) {
            monthlyPrice = 14.99;
        } else if (plan.equals("PREMIUM")) {
            monthlyPrice = 19.99;
        } else if (plan.equals("ENTERPRISE")) {
            monthlyPrice = 49.99;
        } else {
            monthlyPrice = 9.99;
        }
        
        // Magic discount thresholds
        if (months >= 12) {
            return monthlyPrice * months * 0.8;  // 20% annual discount
        } else if (months >= 6) {
            return monthlyPrice * months * 0.9;  // 10% semi-annual discount
        }
        return monthlyPrice * months;
    }
}
