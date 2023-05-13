import { toast } from '@zerodevx/svelte-toast';
import Notification from '$features/ui/notification.svelte';
import type { ItemTextData } from '$types';

class NotificationManager {
  constructor() {}
  notify(data: ItemTextData) {
  const { title, description } = data;
    toast.push({
      component: {
        src: Notification, 
        props: { title, description },
        sendIdTo: 'toastId',
      },
      pausable: true,
    });
  }
}
const manager = new NotificationManager();
export default manager;
