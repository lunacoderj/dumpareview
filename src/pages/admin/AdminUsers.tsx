import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

type UserProfile = {
  user_id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  phonepe_details: {
    phoneNumber?: string;
    upiId?: string;
  } | null;
  lifetime_reviews: number;
  current_streak: number;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
  last_login?: string;
};

export default function AdminUsers() {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await apiFetch("/api/admin/users");
      setUsers(data || []);
    } catch (err: any) {
      toast({
        title: "Error loading users",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-display text-foreground">Registered Users</h1>
        <p className="text-muted-foreground mt-1">View all users and their progress</p>
      </div>

      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader>
          <CardTitle>User Directory ({users.length})</CardTitle>
          <CardDescription>A comprehensive list of all registered users on the platform.</CardDescription>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader className="bg-secondary/50">
              <TableRow>
                <TableHead className="w-[50px]"></TableHead>
                <TableHead>User Details</TableHead>
                <TableHead>PhonePe Info</TableHead>
                <TableHead className="text-center">Total Reviews</TableHead>
                <TableHead className="text-center">Total 10 Streaks</TableHead>
                <TableHead className="text-right">Total Earned</TableHead>
                <TableHead className="text-right">Last Login</TableHead>
                <TableHead className="text-right">Last Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                    No registered users found.
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => {
                  const payouts = Math.floor((user.lifetime_reviews || 0) / 10);
                  const totalEarned = payouts * 50;

                  return (
                    <TableRow key={user.user_id}>
                      <TableCell>
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={user.avatar_url || undefined} />
                          <AvatarFallback className="bg-primary/20 text-primary">
                            {user.full_name?.[0] || user.email?.[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{user.full_name || 'No Name'}</span>
                          <span className="text-xs text-muted-foreground">{user.email}</span>
                          <span className="text-[10px] text-muted-foreground mt-1 truncate max-w-[150px]" title={user.user_id}>
                            ID: {user.user_id}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {user.phonepe_details ? (
                          <div className="flex flex-col gap-1">
                            {user.phonepe_details.phoneNumber && (
                              <span className="text-sm">📞 {user.phonepe_details.phoneNumber}</span>
                            )}
                            {user.phonepe_details.upiId && (
                              <span className="text-sm">💸 {user.phonepe_details.upiId}</span>
                            )}
                          </div>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">Not set</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className="font-mono">
                          {user.lifetime_reviews || 0}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="font-medium text-primary">{payouts}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-bold text-green-500">₹{totalEarned}</span>
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground whitespace-nowrap">
                        {user.last_login ? new Date(user.last_login).toLocaleString() : 'Never'}
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground whitespace-nowrap">
                        {new Date(user.updated_at || user.created_at).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
