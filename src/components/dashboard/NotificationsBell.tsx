import { Link } from "react-router-dom";
import { Bell, Check, Trash2 } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";

export function NotificationsBell() {
  const { items, unreadCount, markRead, markAllRead, remove } = useNotifications();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 min-w-5 px-1 text-[10px] flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-96 p-0">
        <div className="flex items-center justify-between p-3 border-b">
          <h3 className="font-medium text-sm">Notifications</h3>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={markAllRead}>
              <Check className="h-3 w-3 mr-1" /> Mark all read
            </Button>
          )}
        </div>
        <ScrollArea className="max-h-96">
          {items.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">
              You're all caught up.
            </p>
          ) : (
            <ul className="divide-y">
              {items.map((n) => {
                const inner = (
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${!n.read_at ? "font-medium" : ""}`}>{n.title}</p>
                    {n.body && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{n.body}</p>
                    )}
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                    </p>
                  </div>
                );
                return (
                  <li
                    key={n.id}
                    className={`flex items-start gap-2 p-3 hover:bg-muted/40 ${!n.read_at ? "bg-primary/5" : ""}`}
                  >
                    {n.link ? (
                      <Link to={n.link} className="flex-1 min-w-0" onClick={() => markRead(n.id)}>
                        {inner}
                      </Link>
                    ) : (
                      inner
                    )}
                    <div className="flex flex-col gap-1">
                      {!n.read_at && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          onClick={() => markRead(n.id)}
                          aria-label="Mark read"
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                      )}
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={() => remove(n.id)}
                        aria-label="Delete"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
