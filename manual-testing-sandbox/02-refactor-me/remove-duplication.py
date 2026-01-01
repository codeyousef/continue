# REFACTOR ME: This file has massive code duplication

class UserReport:
    """Generate reports for users - lots of repeated code!"""
    
    def generate_daily_user_report(self, users, date):
        # Duplicated validation
        if not users:
            print("Error: No users provided")
            return None
        if not date:
            print("Error: No date provided")
            return None
            
        # Duplicated header generation
        report = []
        report.append("=" * 60)
        report.append(f"DAILY USER REPORT - {date}")
        report.append("=" * 60)
        report.append("")
        
        # Duplicated data processing
        total_active = 0
        total_inactive = 0
        for user in users:
            if user.get('active'):
                total_active += 1
            else:
                total_inactive += 1
        
        # Duplicated summary
        report.append(f"Total Users: {len(users)}")
        report.append(f"Active Users: {total_active}")
        report.append(f"Inactive Users: {total_inactive}")
        report.append("")
        
        # Duplicated detail section
        report.append("-" * 40)
        report.append("USER DETAILS")
        report.append("-" * 40)
        for user in users:
            status = "ACTIVE" if user.get('active') else "INACTIVE"
            report.append(f"  {user['name']} ({user['email']}) - {status}")
        
        # Duplicated footer
        report.append("")
        report.append("=" * 60)
        report.append(f"Report generated at: {date}")
        report.append("=" * 60)
        
        return "\n".join(report)
    
    def generate_weekly_user_report(self, users, start_date, end_date):
        # Same validation duplicated
        if not users:
            print("Error: No users provided")
            return None
        if not start_date or not end_date:
            print("Error: No date range provided")
            return None
            
        # Same header generation duplicated
        report = []
        report.append("=" * 60)
        report.append(f"WEEKLY USER REPORT - {start_date} to {end_date}")
        report.append("=" * 60)
        report.append("")
        
        # Same data processing duplicated
        total_active = 0
        total_inactive = 0
        for user in users:
            if user.get('active'):
                total_active += 1
            else:
                total_inactive += 1
        
        # Same summary duplicated
        report.append(f"Total Users: {len(users)}")
        report.append(f"Active Users: {total_active}")
        report.append(f"Inactive Users: {total_inactive}")
        report.append("")
        
        # Same detail section duplicated
        report.append("-" * 40)
        report.append("USER DETAILS")
        report.append("-" * 40)
        for user in users:
            status = "ACTIVE" if user.get('active') else "INACTIVE"
            report.append(f"  {user['name']} ({user['email']}) - {status}")
        
        # Same footer duplicated
        report.append("")
        report.append("=" * 60)
        report.append(f"Report generated for period: {start_date} to {end_date}")
        report.append("=" * 60)
        
        return "\n".join(report)
    
    def generate_monthly_user_report(self, users, month, year):
        # Same validation duplicated again
        if not users:
            print("Error: No users provided")
            return None
        if not month or not year:
            print("Error: No month/year provided")
            return None
            
        # Same header generation duplicated again
        report = []
        report.append("=" * 60)
        report.append(f"MONTHLY USER REPORT - {month}/{year}")
        report.append("=" * 60)
        report.append("")
        
        # Same data processing duplicated again
        total_active = 0
        total_inactive = 0
        for user in users:
            if user.get('active'):
                total_active += 1
            else:
                total_inactive += 1
        
        # Same summary duplicated again
        report.append(f"Total Users: {len(users)}")
        report.append(f"Active Users: {total_active}")
        report.append(f"Inactive Users: {total_inactive}")
        report.append("")
        
        # Same detail section duplicated again
        report.append("-" * 40)
        report.append("USER DETAILS")
        report.append("-" * 40)
        for user in users:
            status = "ACTIVE" if user.get('active') else "INACTIVE"
            report.append(f"  {user['name']} ({user['email']}) - {status}")
        
        # Same footer duplicated again
        report.append("")
        report.append("=" * 60)
        report.append(f"Report generated for: {month}/{year}")
        report.append("=" * 60)
        
        return "\n".join(report)


class OrderReport:
    """More duplication with different data types"""
    
    def generate_daily_order_report(self, orders, date):
        if not orders:
            print("Error: No orders provided")
            return None
        if not date:
            print("Error: No date provided")
            return None
            
        report = []
        report.append("=" * 60)
        report.append(f"DAILY ORDER REPORT - {date}")
        report.append("=" * 60)
        report.append("")
        
        total_completed = 0
        total_pending = 0
        total_cancelled = 0
        total_revenue = 0
        
        for order in orders:
            if order.get('status') == 'completed':
                total_completed += 1
                total_revenue += order.get('total', 0)
            elif order.get('status') == 'pending':
                total_pending += 1
            else:
                total_cancelled += 1
        
        report.append(f"Total Orders: {len(orders)}")
        report.append(f"Completed: {total_completed}")
        report.append(f"Pending: {total_pending}")
        report.append(f"Cancelled: {total_cancelled}")
        report.append(f"Total Revenue: ${total_revenue:.2f}")
        report.append("")
        
        report.append("-" * 40)
        report.append("ORDER DETAILS")
        report.append("-" * 40)
        for order in orders:
            report.append(f"  Order #{order['id']} - ${order['total']:.2f} - {order['status'].upper()}")
        
        report.append("")
        report.append("=" * 60)
        report.append(f"Report generated at: {date}")
        report.append("=" * 60)
        
        return "\n".join(report)
    
    def generate_weekly_order_report(self, orders, start_date, end_date):
        # Exact same structure duplicated...
        if not orders:
            print("Error: No orders provided")
            return None
        if not start_date or not end_date:
            print("Error: No date range provided")
            return None
            
        report = []
        report.append("=" * 60)
        report.append(f"WEEKLY ORDER REPORT - {start_date} to {end_date}")
        report.append("=" * 60)
        report.append("")
        
        total_completed = 0
        total_pending = 0
        total_cancelled = 0
        total_revenue = 0
        
        for order in orders:
            if order.get('status') == 'completed':
                total_completed += 1
                total_revenue += order.get('total', 0)
            elif order.get('status') == 'pending':
                total_pending += 1
            else:
                total_cancelled += 1
        
        report.append(f"Total Orders: {len(orders)}")
        report.append(f"Completed: {total_completed}")
        report.append(f"Pending: {total_pending}")
        report.append(f"Cancelled: {total_cancelled}")
        report.append(f"Total Revenue: ${total_revenue:.2f}")
        report.append("")
        
        report.append("-" * 40)
        report.append("ORDER DETAILS")
        report.append("-" * 40)
        for order in orders:
            report.append(f"  Order #{order['id']} - ${order['total']:.2f} - {order['status'].upper()}")
        
        report.append("")
        report.append("=" * 60)
        report.append(f"Report generated for period: {start_date} to {end_date}")
        report.append("=" * 60)
        
        return "\n".join(report)
